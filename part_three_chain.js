import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// From P2Classes
import {Curve_Shape, Spline, Particle, Spring} from './P2Classes.js';

export
const Part_three_chain_base = defs.Part_three_chain_base =
    class Part_three_chain_base extends Component
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

        this.ball_location = vec3(1, 1, 0);
        this.ball_radius = 0.25;

        this.start = false;
        this.d_t = 0.01
        this.gks = 5000;
        this.gkd = 1;
        this.gravity = 9.8
        this.prev_t = 0;
        this.prev_pos = this.ball_location;
        this.particles = [];
        this.springs = [];

        // Add particles to chain
        this.particles.push(new Particle(1.0, vec3(5.0, 6.0, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 5.5, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 5.0, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 4.5, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 4.0, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 3.5, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 3.0, 3.0), vec3(0, 0, 0)));
        this.particles.push(new Particle(1.0, vec3(5.0, 2.5, 3.0), vec3(0, 0, 0)));

        // Add springs to chain
        this.springs.push(new Spring(0, 1, 500, 30, 1));
        this.springs.push(new Spring(1, 2, 500, 30, 1));
        this.springs.push(new Spring(2, 3, 500, 30, 1));
        this.springs.push(new Spring(3, 4, 500, 30, 1));
        this.springs.push(new Spring(4, 5, 500, 30, 1));
        this.springs.push(new Spring(5, 6, 500, 30, 1));
        this.springs.push(new Spring(6, 7, 500, 30, 1));

        // Set spring curves for each spring
        for(let s of this.springs){
          let p_i = this.particles[s.p_i]
          let p_j = this.particles[s.p_j]

          let fn = (t) => p_i.position.plus(
            (p_j.position.minus(p_i.position)).times(t)
          );
          let num_samples = 100;
          s.set_curve(fn, num_samples);
        }

        // TODO: you should create the necessary shapes
        // add point 1.0 1.0 0.0 0.0 1.5  0.0
        // add point 4.0 3.0 0.0 1.0 -1.0 0.0
        // add point 5.0 5.0 5.0 0.5 0.2  -1.2
        // add point 5.0 8.0 3.0 0.5 2.3  -0.5
        this.spline_path = new Spline()
        this.spline_path.add_point(2.0, 8.0, 4.0, 0.5, 2.3, -0.5);
        this.spline_path.add_point(1.0, 8.0, 4.0, 1.0, -1.0, 0.0);
        this.spline_path.add_point(-2.0, 9.0, 6.0, 0.5, 0.2, -1.2);
        this.spline_path.add_point(-1.0, 5.0, 5.0, 0.5, 0.2, -1.2);
        this.spline_path.add_point(-1.0, 5.0, 5.0, 0.5, 0.2, -1.2);
        this.spline_path.add_point(2.0, 8.0, 4.0, 0.5, 2.3, -0.5);
        this.start = true;
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


export class Part_three_chain extends Part_three_chain_base
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

    const blue = color( 0,0,1,1 ), yellow = color( 0.7,1,0,1 );

    const t = this.t = this.uniforms.animation_time/1000.0;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    // this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here. Render loop is called 60 times a sec, loop 1000 in inner loop.
    if(this.start) {

      let dt = 1.0 / 30.0;
      let t_sim = t;
      let t_next = t_sim + dt;
      for(; t_sim<=t_next; t_sim += this.d_t) {
        for(let curve of this.spline_path.curves) {
          curve.draw(caller, this.uniforms);
        }

        for(let s of this.springs) {
          let p_i = this.particles[s.p_i]
          let p_j = this.particles[s.p_j]

          let fn = (t) => p_i.position.plus(
            (p_j.position.minus(p_i.position)).times(t)
          );
          s.curve.update(caller, this.uniforms, fn);
        }

        let new_pos = this.spline_path.at(t_sim);

        let new_vel = new_pos.minus(this.prev_pos).times(1 / (t_sim - this.prev_t))
        if(this.prev_t == 0) new_vel = vec3(0, 0, 0)
        this.particles[0].set_velocity(new_vel);
        
        // Update particles
        this.update_particles();
        
        // Make top particle always follow curve.
        this.particles[0].set_position(new_pos);
        this.particles[0].update_transform();
        
        for(let p of this.particles) {
          this.shapes.ball.draw( caller, this.uniforms, p.particle_transform, { ...this.materials.metal, color: blue } );
        }

        for(let s of this.springs) {
          s.curve.draw(caller, this.uniforms);
        }

        // Update states
        this.prev_pos = new_pos;
        this.prev_t = t_sim;
      }
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
    }

    // Force on top particle is always 0
    this.particles[0].net_force = vec3(0, 0, 0);

    // Euler
    for(let p of this.particles) {
      p.velocity = p.velocity.plus(p.net_force.times(this.d_t / p.mass));
      p.position = p.position.plus(p.velocity.times(this.d_t));
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

        p.velocity = p.velocity.plus(p.net_force.times(this.d_t / p.mass));
        p.position = p.position.plus(p.velocity.times(this.d_t));
        
        // console.log("Spring force: ", F_s);
        // console.log("Damping force: ", F_d);
      }

      p.update_transform();
      p.net_force = vec3(0, -this.gravity, 0);
    }

    // Force on top particle is always 0
    this.particles[0].net_force = vec3(0, 0, 0);
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Three: (no buttons)";
    this.new_line();
  }
}
