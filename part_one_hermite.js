import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.
class Curve_Shape extends Shape {
  // curve_function: (t) => vec3
  constructor(curve_function, sample_count, curve_color=color( 1, 0, 0, 1 )) {
    super("position", "normal");

    this.material = { shader: new defs.Phong_Shader(), ambient: 1.0, color: curve_color }
    this.sample_count = sample_count;

    if (curve_function && this.sample_count) {
      for (let i = 0; i < this.sample_count + 1; i++) {
        let t = i / this.sample_count;
        this.arrays.position.push(curve_function(t));
        this.arrays.normal.push(vec3(0, 0, 0)); // have to add normal to make Phong shader work.
      }
    }
  }

  draw(webgl_manager, uniforms) {
    // call super with "LINE_STRIP" mode
    super.draw(webgl_manager, uniforms, Mat4.identity(), this.material, "LINE_STRIP");
  }

  update(webgl_manager, uniforms, curve_function) {
    if (curve_function && this.sample_count) {
      for (let i = 0; i < this.sample_count + 1; i++) {
        let t = 1.0 * i / this.sample_count;
        this.arrays.position[i] = curve_function(t);
      }
    }
    // this.arrays.position.forEach((v, i) => v = curve_function(i / this.sample_count));
    this.copy_onto_graphics_card(webgl_manager.context);
    // Note: vertex count is not changed.
    // not tested if possible to change the vertex count.
  }

  get_arc_length() {
    let arc_length = 0;
    for(let i = 1; i<this.arrays.position.length; i++) {
      let p1 = this.arrays.position[i - 1];
      let p2 = this.arrays.position[i];
      let res = (p2.minus(p1)).norm();
      arc_length += res;
    }
    return arc_length;
  }

  // get_table(idx, arc_length, total_arc_length) {
  //   let table = [];
  //   for(let i = 1; i<this.arrays.position.length; i++) {
  //     let p1 = this.arrays.position[i - 1];
  //     let p2 = this.arrays.position[i];
  //     let res = (p2.minus(p1)).norm();
  //     arc_length += res;
  //     table.push((idx, ))
  //     console.log(arc_length / total_arc_length);
  //     idx += 1;
  //   }
  //   return arc_length;
  // }
};

class Spline {
  constructor() {
    this.curves = [];
    this.points = [];
    this.tangents = [];
    this.size = 0;
  }

  h00(p, t) {
    return p.times(2*t*t*t - 3*t*t + 1);
  }

  h10(tan, t) {
    return tan.times(t*t*t-2*t*t+t);
  }

  h01(p, t) {
    return p.times(-2*t*t*t+3*t*t)
  }

  h11(tan, t) {
    return tan.times(t*t*t-t*t)
  }

  add_point(x, y, z, tx, ty, tz) {
    this.points.push(vec3(x, y, z));
    this.tangents.push(vec3(tx, ty, tz));
    this.size += 1;
  }

  add_curves(){
    if (this.size <= 1) return;
    
    this.curves = [];

    for(let i = 1; i < this.size; i++){
      let tan1 = this.tangents[i - 1].times(1.0 / (this.points.length - 1));
      let tan2 = this.tangents[i].times(1.0 / (this.points.length - 1));
      let curve_func = (t) => (
        this.h00(this.points[i - 1], t).plus(
          this.h10(tan1, t)
        ).plus(
          this.h01(this.points[i], t)
        ).plus(
          this.h11(tan2, t)
        )
      );
          
      let sample_cnt = 1000;
      this.curves.push(new Curve_Shape(curve_func, sample_cnt));
    }
  }

  set_point(idx, x, y, z, caller, uniforms) {
    this.points[idx] = vec3(x, y, z);
    this.add_curves();
  }

  set_tangent(idx, tx, ty, tz) {
    this.tangents[idx] = vec3(tx, ty, tz);
    this.add_curves();
  }

  get_arc_length() {
    let total_arc_length = 0;
    for (let curve of this.curves) {
      total_arc_length += curve.get_arc_length();
    }

    // let pref_arc_length = 0;
    // let table = [];
    // table.push((0, 0, 0));
    // for (let curve of this.curves) {
    //   pref_arc_length = curve.get_table(pref_arc_length, total_arc_length);
    // }

    return total_arc_length;
  }
}

export
const Part_one_hermite_base = defs.Part_one_hermite_base =
    class Part_one_hermite_base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, Part_one_hermite,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
        // would be redundant to tell it again.  You should just re-use the
        // one called "box" more than once in display() to draw multiple cubes.
        // Don't define more than one blueprint for the same thing here.
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows() };

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }

        this.ball_location = vec3(2, 4, 0);
        this.ball_radius = 0.25;

        this.start = false;

        // TODO: you should create a Spline class instance
        this.spline = new Spline();
      }

      render_animation( caller )
      {
        // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Part_one_hermite, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if( !caller.controls )
        { this.animated_children.push( caller.controls = new defs.Movement_Controls( { uniforms: this.uniforms } ) );
          caller.controls.add_mouse_controls( caller.canvas );

          // Define the global camera and projection matrices, which are stored in shared_uniforms.  The camera
          // matrix follows the usual format for transforms, but with opposite values (cameras exist as
          // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
          // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() or
          // orthographic() automatically generate valid matrices for one.  The input arguments of
          // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.

          // !!! Camera changed here
          Shader.assign_camera( Mat4.look_at (vec3 (10, 10, 10), vec3 (0, 0, 0), vec3 (0, 1, 0)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 100 );

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = this.uniforms.animation_time/1000;
        const angle = Math.sin( t );

        // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
        // !!! Light changed here
        const light_position = vec4(20 * Math.cos(angle), 20,  20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [ defs.Phong_Shader.light_source( light_position, color( 1,1,1,1 ), 1000000 ) ];

        // draw axis arrows.
        this.shapes.axis.draw(caller, this.uniforms, Mat4.identity(), this.materials.rgb);
      }
    }


export class Part_one_hermite extends Part_one_hermite_base
{                

  // **Part_one_hermite** is a Scene object that can be added to any display canvas.
  // This particular scene is broken up into two pieces for easier understanding.
  // See the other piece, My_Demo_Base, if you need to see the setup code.
  // The piece here exposes only the display() method, which actually places and draws
  // the shapes.  We isolate that code so it can be experimented with on its own.
  // This gives you a very small code sandbox for editing a simple scene, and for
  // experimenting with matrix transformations.

  render_animation( caller )
  {                                                
    // display():  Called once per frame of animation.  For each shape that you want to
    // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
    // different matrix value to control where the shape appears.

    // Variables that are in scope for you to use:
    // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
    // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
    // this.materials.metal:    Selects a shader and draws with a shiny surface.
    // this.materials.plastic:  Selects a shader and draws a more matte surface.
    // this.lights:  A pre-made collection of Light objects.
    // this.hover:  A boolean variable that changes when the user presses a button.
    // shared_uniforms:  Information the shader needs for drawing.  Pass to draw().
    // caller:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

    // Call the setup code that we left inside the base class:
    super.render_animation( caller );

    /**********************************
     Start coding down here!!!!
     **********************************/
    // From here on down it's just some example shapes drawn for you -- freely
    // replace them with your own!  Notice the usage of the Mat4 functions
    // translation(), scale(), and rotation() to generate matrices, and the
    // function times(), which generates products of matrices.

    const blue = color( 0,0,1,1 ), yellow = color( 1,0.7,0,1 );

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here.
    if(this.start) {
      for(let curve of this.spline.curves) {
        curve.draw(caller, this.uniforms);
      }
    }
  }

  render_controls()
  {                                 
    
    // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.

    this.control_panel.innerHTML += "Part One:";
    this.new_line();
    this.key_triggered_button( "Parse Commands", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Draw", [], this.update_scene );
    this.new_line();
    this.key_triggered_button( "Load", [], this.load_spline );
    this.new_line();
    this.key_triggered_button( "Export", [], this.export_spline );
    this.new_line();

    /* Some code for your reference
    this.key_triggered_button( "Copy input", [ "c" ], function() {
      let text = document.getElementById("input").value;
      console.log(text);
      document.getElementById("output").value = text;
    } );
    this.new_line();
    this.key_triggered_button( "Relocate", [ "r" ], function() {
      let text = document.getElementById("input").value;
      const words = text.split(' ');
      if (words.length >= 3) {
        const x = parseFloat(words[0]);
        const y = parseFloat(words[1]);
        const z = parseFloat(words[2]);
        this.ball_location = vec3(x, y, z)
        document.getElementById("output").value = "success";
      }
      else {
        document.getElementById("output").value = "invalid input";
      }
    } );
     */
  }

  parse_commands() {
    document.getElementById("output").value = "parse_commands";
    //TODO

    let text = document.getElementById("input").value;
    const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");
    for(const line of lines) {
      const words = line.split(" ").filter(item => item !== '');
      let cmd = words[0];
      switch (cmd) {
        case "add":
          console.log("Add point");
          this.spline.add_point(
            parseFloat(words[2]),
            parseFloat(words[3]),
            parseFloat(words[4]),
            parseFloat(words[5]),
            parseFloat(words[6]),
            parseFloat(words[7]),
          );
          document.getElementById("output").value = "success";
          break;
        case "set":
          if(words[1] === "point"){
            console.log("Set point");
            this.spline.set_point(
              parseInt(words[2]),
              parseFloat(words[3]),
              parseFloat(words[4]),
              parseFloat(words[5])
            );
          }
          else {
            console.log("Set tangent");
            this.spline.set_tangent(
              parseInt(words[2]),
              parseFloat(words[3]),
              parseFloat(words[4]),
              parseFloat(words[5])
            );
          }
          document.getElementById("output").value = "success";
          break;
        case "get_arc_length":
          // Get arc length;
          console.log("Get Arc Length");
          this.spline.add_curves();
          console.log("Arc Length: ", this.spline.get_arc_length());
          document.getElementById("output").value = "success";
          return;
        default:
          document.getElementById("output").value = "invalid input";
      }
    }

    this.spline.add_curves();
  }

  update_scene() { // callback for Draw button
    document.getElementById("output").value = "update_scene";
    //TODO
    this.start = true;
  }

  load_spline() {
    document.getElementById("output").value = "load_spline";
    //TODO
    let text = document.getElementById("input").value;
    const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");
    for(let line of lines) {
      const words = line.split(" ").filter(item => item !== '');
      if(words.length != 1) {
          this.spline.add_point(
            parseFloat(words[0]),
            parseFloat(words[1]),
            parseFloat(words[2]),
            parseFloat(words[3]),
            parseFloat(words[4]),
            parseFloat(words[5]),
          );
          document.getElementById("output").value = "success";
      }
    }

    this.spline.add_curves();
  }

  export_spline() {
    //TODO
    let output = `${this.spline.size}\n`;
    for(let i = 0; i<this.spline.size; i++){
      // Loop through points
      for(let x of this.spline.points[i])
        output += `${x} `;
      // Loop through tangents
      for(let x of this.spline.tangents[i])
        output += `${x} `;
      output += `\n`;
    }

    document.getElementById("output").value = output;
  }
}

// add point 0.0 4.0 0.0 -12.0, -3.0, 12.0
// add point 0.0 3.0 4.0   9.0, -3.0,  9.0
// add point 3.0 2.0 4.0   9.0, -3.0, -9.0
// add point 3.0 1.0 0.0 -12.0, -3.0, -12.0

// add point 1.0 1.0 0.0 0.0 1.5  0.0
// add point 4.0 3.0 0.0 1.0 -1.0 0.0
// add point 5.0 5.0 5.0 0.5 0.2  -1.2

// add point  0.0 5.0 0.0   -20.0  0.0   20.0
// add point  0.0 5.0 5.0    20.0  0.0   20.0
// add point  5.0 5.0 5.0    20.0  0.0  -20.0
// add point  5.0 5.0 0.0   -20.0  0.0  -20.0
// add point  0.0 5.0 0.0   -20.0  0.0   20.0
// set point 4 0.0 5.0 0.0
// set tangent 4 -20.0  0.0   20.0
// get_arc_length
