import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// From P2Classes
import {Curve_Shape, Particle, Spring} from './P2Classes.js';

// TODO: you should implement the required classes here or in another file.

export
const Part_two_spring_base = defs.Part_two_spring_base =
    class Part_two_spring_base extends Component
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

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;

        // TODO: you should create the necessary shapes
        this.particles = null;
        this.num_particles = 0;
        this.springs = null;
        this.springs = 0;

        this.integration_method = "euler";
        this.d_t = 0.0;

        this.gks = 0.0;
        this.gkd = 0.0;
        this.gravity = 0.0;

        this.flag = false;
      }

      render_animation( caller )
      {                                                // display():  Called once per frame of animation.  We'll isolate out
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


export class Part_two_spring extends Part_two_spring_base
{                                                    // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                     // experimenting with matrix transformations.
  render_animation( caller )
  {                                                // display():  Called once per frame of animation.  For each shape that you want to
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

    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 );

    const t = this.t = this.uniforms.animation_time/1000.0;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here.
    if(this.flag){

      let dt = 1.0 / 30.0;
      let t_sim = t;
      let t_next = t_sim + dt;
      for(; t_sim<=t_next; t_sim += this.d_t) {
        this.update_particles();

        for(let s of this.springs) {
          let p_i = this.particles[s.p_i]
          let p_j = this.particles[s.p_j]

          let fn = (t) => p_i.position.plus(
            (p_j.position.minus(p_i.position)).times(t)
          );
          s.curve.update(caller, this.uniforms, fn);
        }
        
        for(let p of this.particles) {
          this.shapes.ball.draw( caller, this.uniforms, p.particle_transform, { ...this.materials.metal, color: blue } );
        }
        for(let s of this.springs) {
          s.curve.draw(caller, this.uniforms);
        }

      }
    }
  }

  integrate(p) {
    if(this.integration_method === "euler") {
      let temp = p.velocity.copy();
      p.velocity = p.velocity.plus(p.net_force.times(this.d_t / p.mass));
      p.position = p.position.plus(temp.times(this.d_t));
    }
    else if(this.integration_method === "symplectic") {
      p.velocity = p.velocity.plus(p.net_force.times(this.d_t / p.mass));
      p.position = p.position.plus(p.velocity.times(this.d_t));
    }
    else{
      let accel = p.net_force.times(1 / p.mass);
      p.position = p.position.plus(p.velocity.times(this.d_t)).plus(accel.times(this.d_t * this.d_t / 2.0));
      // p.velocity = p.velocity.plus()
    }
  }

  update_particles(){
    // Update all forces
    for(let s of this.springs){
      let p_i = this.particles[s.p_i];
      let p_j = this.particles[s.p_j];

      // Get distance between particles
      let d_ij = p_j.position.minus(p_i.position);
      let d_ij_mag = d_ij.norm();
      let d_ij_norm = d_ij.normalized();

      // Total force from spring
      let F_s = d_ij_norm.times(s.ks * (d_ij_mag - s.l));

      // Total force from damper
      let F_d = d_ij_norm.times(-1.0 * s.kd * (p_j.velocity.minus(p_i.velocity)).dot(d_ij_norm));

      // Net Force
      let F_net = F_s.minus(F_d);

      // Update bi-particle forces
      p_i.net_force = p_i.net_force.plus(F_net);
      p_j.net_force = p_j.net_force.minus(F_net);

      // console.log("Magnitude: ", d_ij_mag);
      
      // console.log("Spring force: ", F_s);
      // console.log("Damping force: ", F_d);
    }

    // Integration
    for(let p of this.particles) {
      this.integrate(p);
    }

    // Collision Detection
    for(let p of this.particles) {
      // Particle has hit the ground
      let penetration = p.radius - p.position[1];
      if(penetration > 0.01) {
        let norm = vec3(0, 1, 0);
        let F_s = norm.times(this.gks * penetration);
        let F_d = norm.times(-1.0 * this.gkd * p.velocity.dot(norm));
        let F_net = F_s.plus(F_d);
        p.net_force = p.net_force.plus(F_net);

        this.integrate(p);
        
        // console.log("Spring force: ", F_s);
        // console.log("Damping force: ", F_d);
      }

      // console.log("Particle 0 velocity ", this.particles[0].velocity);

      p.update_transform();
      p.net_force = vec3(0, -this.gravity, 0);
    }
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Two:";
    this.new_line();
    this.key_triggered_button( "Config", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Run", [], this.start );
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
    for(let line of lines) {
      const words = line.split(" ").filter(item => item !== '');
      let cmd = words[0];
      switch(cmd){
        case "create":
          if(words[1] === "particles"){
            console.log("Creating particle system");
            this.num_particles = parseInt(words[2]);
            this.particles = new Array(this.num_particles);
          }
          else{
            console.log("Creating spring system");
            this.num_springs = parseInt(words[2]);
            this.springs = new Array(this.num_springs);
          }
          break;
        case "particle": {
          console.log("Setting particle mass and velocity");
          let idx = parseInt(words[1]);
          let mass = parseInt(words[2]);
          let [x, y, z, vx, vy, vz] = words.slice(3).map((k) => parseFloat(k));
          this.particles[idx] = new Particle(mass, vec3(x, y, z), vec3(vx, vy, vz));
          break;
        }
        case "all_velocities": {
          console.log("Setting all particle velocities");
          let [vx, vy, vz] = words.slice(1).map((k) => parseFloat(k));
          for(let p of this.particles) {
            p.set_velocity(vec3(vx, vy, vz));
          }
          break;
        }
        case "link":{
          console.log("Linking two particles with a spring");
          let sidx = parseInt(words[1]);
          let p_i = parseInt(words[2]);
          let p_j = parseInt(words[3]);
          let [ks, kd, l] = words.slice(4).map((k) => parseFloat(k));
          this.springs[sidx] = new Spring(p_i, p_j, ks, kd, l);
          break;
        }
        case "integration":
          console.log("Changing integration method");
          this.integration_method = words[1] === "verlet" ? "symplectic" : words[1];
          this.d_t = parseFloat(words[2]) * 10;
          break;
        case "ground":
          console.log("Changing ks and kd of ground");
          this.gks = parseFloat(words[1]);
          this.gkd = parseFloat(words[2]);
          break;
        case "gravity":
          console.log("Changing gravity constant");
          this.gravity = parseFloat(words[1]);

          // Set all particle grav
          for(let p of this.particles) {
            p.net_force = vec3(0, -this.gravity, 0);
          }
          break;
        default:
          console.log("Bad input command");
      }
    }

    // Set curves on springs
    for(let s of this.springs){
      let p_i = this.particles[s.p_i]
      let p_j = this.particles[s.p_j]

      let fn = (t) => p_i.position.plus(
        (p_j.position.minus(p_i.position)).times(t)
      );
      let num_samples = 100;
      s.set_curve(fn, num_samples);
    }
  }

  start() { // callback for Run button
    document.getElementById("output").value = "start";
    //TODO

    this.flag = true;

    this.update_particles();

    this.prev_t = this.uniforms.animation_time/1000.0;
  }
}

// create particles 2
// particle 0  1.0  0 5 0   0  0  0
// particle 1  1.0  0 5 5   0  0  0
// create springs 1
// link 0  0 1  5  0.1  3
// ground 5000 1
// gravity 9.8
// integration euler 0.001
