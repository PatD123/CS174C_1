# Part 1

![Screenshot 2025-03-04 142126](https://github.com/user-attachments/assets/f00c13a2-6d40-4e7d-8e19-01e3d834e615)


I used the Curve Shape shown in Discussion. I made a Spline class that holds all the control
points and each spline is made up of a bunch of Curve Shapes. I parse my commands.

- 1-4: Parse Command Function
- Arc_Length: Curve Shape
- Spline: Spline Class - Adding points, tangent scaling, etc.
- 5: Done in Spline (68 - 154) and Curve Shape. Curve drawn in render_animation()

# Part 2

https://github.com/user-attachments/assets/ccb956a6-6ad0-4ed6-ac14-68bd6834487f

I have a Spring and a Particle class in P2Classes.js. Particle has particle info like mass
and net force, but it also has a particle transform that describes where it is. The Spring
class has all the spring info like ks and kd, but it also houses a Curve Shape that can be
drawn as Curve Shape.

I do 1000/30 updates I think instead of using 1/60 to get a faster, more realistic animation.
I do updates per symplectic euler step.

On particle updates, I loop through all springs and recompute the forces on each of the particles.
Then for each of the particles, I do a time step worth of velocity and position changes.

- 1-8: All in parse commands to parse commands.
- Spring + Particle: Located in P2Classes.js.
- Integration: 181-196
- Force Updates: update_particles() - Collision detection + response are here as well.
- Animation runs in render_animation();

# Part 3

https://github.com/user-attachments/assets/e27c625e-8413-44eb-b4f8-ebeb8cb41341

Essentially just a combination of Part 
1 and Part 2. Didn't really change much apart from the
fact that we are allowed to hardcode in our spline, springs, particles, etc. and any of the
characteristics that came with each. Another difference was that with the top particle because
technically it doesn't act like a regular particle in that it has no vertical force of gravity,
I just reset the force on this particle all the time.

Hardcoded Spline + Control Points: 12 - 139
I have a similar integration + update_particles.

# Notes

- Arc length is printed in CONSOLE (Didn't know what output meant on the spec).
- Parse params then Draw. Can export, but this can't be parsed. Only drawn.
- Some of the integration steps shown in discussion I had to change for
  better optimization.
- **EVERY SINGLE TIME WHEN YOU WANT TO RERUN A PART, REFRESH SCREEN.**
  - Sometimes, it runs too slow because it doesn't garbage collect the shapes
    so they are still there.
  - Gets the accurate arc length!!!!!!
- Whenver my computer was in low-power-mode, the graphics would slow which makes sense.

# Tests

### P1

1. add point 0.0 5.0 0.0 -20.0 0.0 20.0
   add point 0.0 5.0 5.0 20.0 0.0 20.0
   add point 5.0 5.0 5.0 20.0 0.0 -20.0
   add point 5.0 5.0 0.0 -20.0 0.0 -20.0
   add point 0.0 5.0 0.0 -20.0 0.0 20.0
   get_arc_length
2. add point 0.0 4.0 0.0 -12.0 -3.0 12.0
   add point 0.0 3.0 4.0 9.0 -3.0 9.0
   add point 3.0 2.0 4.0 9.0 -3.0 -9.0
   add point 3.0 1.0 0.0 -12.0 -3.0 -12.0
3. add point 0.0 5.0 0.0 -20.0 0.0 20.0
   add point 0.0 5.0 5.0 20.0 0.0 20.0
   add point 5.0 5.0 5.0 20.0 0.0 -20.0
   add point 5.0 5.0 0.0 -20.0 0.0 -20.0
   add point 0.0 5.0 0.0 -20.0 0.0 20.0
   set point 4 0.0 5.0 0.0
   set tangent 4 -20.0 0.0 20.0
   get_arc_length

### P2

1.  create particles 4
    particle 0 1.0 0 5 0 0 5 0
    particle 1 1.0 0 5 5 0 5 0
    particle 2 1.0 5 5 5 0 5 0
    particle 3 1.0 5 5 0 0 5 0
    create springs 4
    link 0 0 1 5 0.1 3
    link 1 1 2 5 0.1 3
    link 2 2 3 5 0.1 3
    link 3 3 0 5 0.1 3
    ground 5000 1
    gravity 9.8
    integration symplectic 0.001
2.  create particles 4
    particle 0 1.0 0 5 0 -2 5 2
    particle 1 1.0 0 5 5 2 5 2
    particle 2 1.0 5 5 5 2 5 -2
    particle 3 1.0 5 5 0 -2 5 -2
    create springs 4
    link 0 0 1 30 5 2
    link 1 1 2 50 2 3
    link 2 2 3 80 0.4 4
    link 3 3 0 150 0 5
    ground 5000 10
    gravity 9.8
    integration symplectic 0.001
3.  create particles 4
    particle 0 1.0 0 3 0 5 5 5
    particle 1 1.0 3 6 0 0 5 0
    particle 2 1.0 0 6 3 0 5 0
    particle 3 1.0 0 6 0 0 5 0
    create springs 6
    link 0 3 1 500 10 3
    link 1 3 2 500 10 3
    link 2 3 0 500 10 3
    link 3 1 2 500 10 4.24264
    link 4 1 0 500 10 4.24264
    link 5 2 0 500 10 4.24264
    ground 15000 10
    gravity 9.8
    integration symplectic 0.001

### P3

It runs automatically
