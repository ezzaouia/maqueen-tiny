// Settings at the top of the program must stick (this used to be reset).
robot.setMode(robot.Mode.Normal)
robot.setSpeed(100)
robot.setMaxSpeed(150)
robot.setMaxStep(3)
robot.setWheelBalance(0)
robot.setQuarterTurnTime(400)
robot.setBrightness(64)
if (!robot.isMode(robot.Mode.Normal)) basic.showIcon(IconNames.No)

robot.lightBack(robot.Colors.Green)
robot.lightFront(robot.Colors.Red)

input.onButtonPressed(Button.A, function () {
    robot.move(robot.Direction.Run, 2)
    robot.moveFor(robot.Direction.SpinLeft, 500)
    robot.turn(robot.Turn.Right, 90)
    robot.tank(100, -100)
    robot.stop()
})

input.onButtonPressed(Button.B, function () {
    robot.honk()
    robot.stopMusic()
    robot.rainbow()
    robot.blink(robot.Colors.Blue, 2)
    robot.lightBackPixel(0, robot.Colors.Pink)
    robot.lightBackRGB(10, 20, 30)
    robot.headlight(robot.Side.Left, true)
    robot.lightsOff()
})

robot.onObstacle(15, function () {
    robot.honk()
})

robot.onLine(robot.Side.Both, function () {
    robot.stop()
})

basic.forever(function () {
    if (robot.isObstacleCloserThan(10) || robot.isOnLine(robot.Side.Left)) {
        basic.showNumber(robot.getObstacleDistance())
    }
    if (robot.isIrLeft(robot.IRState.White) && robot.isIrRight(robot.IRState.Black)) {
        robot.followLine()
    } else if (robot.getMode() == robot.Mode.Sport) {
        robot.avoidObstacles(15)
    } else {
        robot.followObject()
    }
})
