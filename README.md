
> Open this page at [https://ezzaouia.github.io/maqueen-tiny/](https://ezzaouia.github.io/maqueen-tiny/)

# Robot: easy blocks for the Maqueen robot

Simple blocks that let kids drive a [DFRobot Maqueen](https://www.dfrobot.com/product-1783.html)
robot with a micro:bit: move, turn, light up, play music, follow lines,
dodge obstacles, and drive by remote control.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/ezzaouia/maqueen-tiny** and import

## Modes

The robot has three modes. Pick one with `set mode`. You can put it anywhere, even
at the very top of your program.

| Mode | What happens |
| --- | --- |
| **safe** (default) | `move` goes a few small steps and stops by itself. Speed is capped at the max speed. |
| **normal** | The robot keeps moving until you `stop`. Speed is capped at the max speed. |
| **sport** | The robot keeps moving at full speed. |

```blocks
robot.setMode(robot.Mode.Normal)
robot.setSpeed(100)
```

## Drive

```blocks
robot.move(robot.Direction.Run)
robot.moveFor(robot.Direction.Back, 1000)
robot.turn(robot.Turn.Left, 90)
robot.tank(100, -100)
robot.stop()
```

* `move` goes forward, backward, left, right, spin left, spin right, or stops.
* `move ... for ... ms` moves for some time, then stops. It works in every mode.
* `turn left/right by 90 °` spins on the spot. If the angle is off, change `set quarter turn time`.
* `drive left wheel ... right wheel ...` sets each wheel from -255 (backward) to 255 (forward).

If your robot curves when it should go straight, use `set wheel balance`.

## Sensors

```blocks
basic.forever(function () {
    if (robot.isObstacleCloserThan(10)) {
        robot.stop()
    }
    basic.showNumber(robot.getObstacleDistance())
})
robot.onObstacle(15, function () {
    robot.honk()
})
robot.onLine(robot.Side.Both, function () {
    robot.stop()
})
```

* `obstacle distance (cm)` gives 500 when nothing is in front of the robot.
* `left/right/both sensor on black line` checks the two line sensors under the robot.

## Lights and sound

```blocks
robot.lightBack(robot.Colors.Green)
robot.rainbow()
robot.blink(robot.Colors.Red, 3)
robot.headlight(robot.Side.Both, true)
robot.playMusic(robot.Music.nyan)
robot.honk()
```

## Project ideas

### Line follower

Draw a thick black line on white paper, put the robot on it, and press A.

```blocks
input.onButtonPressed(Button.A, function () {
    robot.setMode(robot.Mode.Normal)
    robot.setSpeed(70)
    basic.forever(function () {
        robot.followLine()
    })
})
```

### Obstacle explorer

The robot drives around and turns away from walls.

```blocks
robot.setMode(robot.Mode.Normal)
basic.forever(function () {
    robot.avoidObstacles(15)
})
```

### Robot pet

Hold your hand in front of the robot and it follows you.

```blocks
robot.setMode(robot.Mode.Normal)
basic.forever(function () {
    robot.followObject()
})
```

### Dancing pet

Autopilot blocks (`follow black line`, `avoid obstacles`, `follow my hand`) wait
while the robot is doing a move that ends by itself (`dance`, `turn`, `move for`,
or a `move` in safe mode), then carry on. So you can mix them freely:

```blocks
robot.setMode(robot.Mode.Normal)
robot.dance()
input.onButtonPressed(Button.B, function () {
    robot.dance()
})
input.onButtonPressed(Button.A, function () {
    robot.playMusic(robot.Music.birthday)
    robot.turn(robot.Turn.Left, 360)
})
basic.forever(function () {
    robot.followObject()
})
```

`play music` never waits: the tune plays while the robot keeps moving.

### Tilt remote control

You need two micro:bits, both using the same group number.

On the **remote** micro:bit, tilt forward, back, left and right to drive:

```blocks
robot.startRemoteController(1)
```

On the **robot** micro:bit:

```blocks
robot.setMode(robot.Mode.Normal)
robot.startRemoteReceiver(1)
```

The robot stops by itself if it stops hearing the remote. The receiver uses
`on radio received value`, so don't use that block in the robot's program.

## Edit this project

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/ezzaouia/maqueen-tiny** and click import

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
