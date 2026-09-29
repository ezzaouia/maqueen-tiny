/**
 * Robot: simple blocks for driving the DFRobot Maqueen with a micro:bit.
 */
//% weight=100 color="#0fbc11" icon="\uf1b9" block="Robot"
//% groups='["Drive", "Sensors", "Lights", "Sound", "Autopilot", "Remote control", "Settings"]'
namespace robot {

    export enum Mode {
        //% block="safe"
        Safe = 0,
        //% block="normal"
        Normal = 1,
        //% block="sport"
        Sport = 2,
    }

    export enum Direction {
        //% block="forward"
        Run = 1,
        //% block="backward"
        Back = 2,
        //% block="left"
        Left = 3,
        //% block="right"
        Right = 4,
        //% block="stop"
        Stop = 5,
        //% block="spin left"
        SpinLeft = 6,
        //% block="spin right"
        SpinRight = 7,
    }

    export enum Turn {
        //% block="left"
        Left = 0,
        //% block="right"
        Right = 1,
    }

    export enum Side {
        //% block="left"
        Left = 0,
        //% block="right"
        Right = 1,
        //% block="both"
        Both = 2,
    }

    export enum Music {
        //% block="dadadum"
        dadadum = 0,
        //% block="entertainer"
        entertainer,
        //% block="prelude"
        prelude,
        //% block="ode"
        ode,
        //% block="nyan"
        nyan,
        //% block="ringtone"
        ringtone,
        //% block="funk"
        funk,
        //% block="blues"
        blues,
        //% block="birthday"
        birthday,
        //% block="wedding"
        wedding,
        //% block="funeral"
        funereal,
        //% block="punchline"
        punchline,
        //% block="baddy"
        baddy,
        //% block="chase"
        chase,
        //% block="ba ding"
        ba_ding,
        //% block="wawawawaa"
        wawawawaa,
        //% block="jump up"
        jump_up,
        //% block="jump down"
        jump_down,
        //% block="power up"
        power_up,
        //% block="power down"
        power_down,
    }

    export enum Colors {
        //% block=red
        Red = 0xff0000,
        //% block=orange
        Orange = 0xffa500,
        //% block=yellow
        Yellow = 0xffff00,
        //% block=green
        Green = 0x00ff00,
        //% block=cyan
        Cyan = 0x00ffff,
        //% block=blue
        Blue = 0x0000ff,
        //% block=indigo
        Indigo = 0x4b0082,
        //% block=violet
        Violet = 0x8a2be2,
        //% block=purple
        Purple = 0xff00ff,
        //% block=pink
        Pink = 0xff69b4,
        //% block=white
        White = 0xffffff,
        //% block="off (black)"
        Black = 0x000000,
    }

    // The Maqueen line sensors read 1 over white and 0 over black.
    export enum IRState {
        //% block="white line"
        White = 1,
        //% block="black line"
        Black = 0,
    }

    // ---------------------------------------------------------------
    // State
    //
    // Nothing below has an initializer on purpose. Namespace-level
    // initializers run in file order, so a kid's `setMode(...)` that ran
    // before them was silently overwritten. Everything is created lazily
    // on first use instead, which works no matter where user code sits.
    // ---------------------------------------------------------------

    const STEP_MS = 200;          // how long one "step" lasts in safe mode
    const TURN_SPEED = 80;        // wheel speed used by turn(), so calibration is stable
    const NOTHING_CM = 500;       // the ultrasonic sensor reports 500 when it sees nothing
    const REMOTE_TIMEOUT_MS = 500;

    class Settings {
        mode: Mode;
        speed: number;
        maxSpeed: number;
        maxStep: number;
        balance: number;
        quarterTurnMs: number;
        brightness: number;
        constructor() {
            this.mode = Mode.Safe;
            this.speed = 125;
            this.maxSpeed = 150;
            this.maxStep = 3;
            this.balance = 0;
            this.quarterTurnMs = 400;
            this.brightness = 128;
        }
    }

    let _settings: Settings;
    let _strip: neopixel.Strip;
    let _motorsReady: boolean;
    let _lastLine: Turn;
    let _sensorLoopStarted: boolean;
    let _distance: number;
    let _distanceAt: number;
    let _obstacleWatchers: ObstacleWatcher[];
    let _lineWatchers: LineWatcher[];
    let _remoteLastSeen: number;

    function cfg(): Settings {
        if (!_settings) _settings = new Settings();
        return _settings;
    }

    function strip(): neopixel.Strip {
        if (!_strip) {
            _strip = neopixel.create(DigitalPin.P15, 4, NeoPixelMode.RGB);
            _strip.setBrightness(cfg().brightness);
        }
        return _strip;
    }

    // ---------------------------------------------------------------
    // Drive
    // ---------------------------------------------------------------

    /**
     * Move the robot in a direction.
     * In safe mode it moves a few small steps and stops by itself.
     * In normal and sport mode it keeps going until you stop it.
     * @param direction where to go
     * @param step how many small steps (safe mode only)
     */
    //% blockId=robot_move block="move $direction||for $step steps"
    //% step.defl=1 step.min=1 step.max=5
    //% expandableArgumentMode="toggle"
    //% weight=100 group="Drive"
    export function move(direction: Direction = Direction.Run, step: number = 1) {
        if (direction === Direction.Stop) {
            stop();
            return;
        }
        const s = cfg().speed;
        switch (direction) {
            case Direction.Run: drive(s, s, step); break;
            case Direction.Back: drive(-s, -s, step); break;
            case Direction.Left: drive(0, s, step); break;
            case Direction.Right: drive(s, 0, step); break;
            case Direction.SpinLeft: drive(-s, s, step); break;
            case Direction.SpinRight: drive(s, -s, step); break;
        }
    }

    /**
     * Move in a direction for some time, then stop. Works in every mode.
     * @param direction where to go
     * @param ms how long, in milliseconds
     */
    //% blockId=robot_move_for block="move $direction for $ms ms"
    //% ms.shadow=timePicker ms.defl=1000
    //% weight=95 group="Drive"
    export function moveFor(direction: Direction, ms: number) {
        const s = limit(cfg().speed);
        switch (direction) {
            case Direction.Run: setWheels(s, s); break;
            case Direction.Back: setWheels(-s, -s); break;
            case Direction.Left: setWheels(0, s); break;
            case Direction.Right: setWheels(s, 0); break;
            case Direction.SpinLeft: setWheels(-s, s); break;
            case Direction.SpinRight: setWheels(s, -s); break;
            default: setWheels(0, 0); break;
        }
        basic.pause(ms);
        setWheels(0, 0);
    }

    /**
     * Spin on the spot by about this many degrees, then stop.
     * If the angle is off, use "set quarter turn time" to calibrate.
     * @param side which way to turn
     * @param degrees how far to turn, 90 is a quarter turn
     */
    //% blockId=robot_turn block="turn $side by $degrees °"
    //% degrees.defl=90 degrees.min=0 degrees.max=360
    //% weight=90 group="Drive"
    export function turn(side: Turn, degrees: number) {
        const s = limit(TURN_SPEED);
        if (side === Turn.Left) setWheels(-s, s);
        else setWheels(s, -s);
        basic.pause(Math.abs(degrees) * cfg().quarterTurnMs / 90);
        setWheels(0, 0);
    }

    /**
     * Set the speed of each wheel. Negative numbers go backward.
     * @param leftSpeed left wheel speed, from -255 to 255
     * @param rightSpeed right wheel speed, from -255 to 255
     */
    //% blockId=robot_tank block="drive left wheel $leftSpeed right wheel $rightSpeed"
    //% leftSpeed.min=-255 leftSpeed.max=255 leftSpeed.defl=100
    //% rightSpeed.min=-255 rightSpeed.max=255 rightSpeed.defl=100
    //% inlineInputMode=inline
    //% weight=85 group="Drive"
    export function tank(leftSpeed: number, rightSpeed?: number) {
        if (rightSpeed === undefined) rightSpeed = leftSpeed;
        if (leftSpeed === 0 && rightSpeed === 0) {
            stop();
            return;
        }
        drive(leftSpeed, rightSpeed, 1);
    }

    /**
     * Stop both wheels right away.
     */
    //% blockId=robot_stop block="stop"
    //% weight=80 group="Drive"
    export function stop() {
        setWheels(0, 0);
    }

    // ---------------------------------------------------------------
    // Sensors
    // ---------------------------------------------------------------

    /**
     * Distance to the nearest thing in front of the robot, in cm.
     * Gives 500 when nothing is in sight.
     */
    //% blockId=robot_getObstacleDistance block="obstacle distance (cm)"
    //% weight=100 group="Sensors"
    export function getObstacleDistance(): number {
        // When the background sensor loop is running, reuse its reading so
        // two fibers never trigger the ultrasonic sensor at the same time.
        if (_sensorLoopStarted && control.millis() - _distanceAt < 150) return _distance;
        return readDistance();
    }

    /**
     * True when something is closer than this many cm.
     * @param cm distance in cm
     */
    //% blockId=robot_isObstacleCloserThan block="obstacle closer than $cm cm"
    //% cm.defl=15 cm.min=2 cm.max=100
    //% weight=95 group="Sensors"
    export function isObstacleCloserThan(cm: number): boolean {
        return getObstacleDistance() < cm;
    }

    /**
     * Run some code when something comes closer than this many cm.
     * @param cm distance in cm
     */
    //% blockId=robot_onObstacle block="when obstacle closer than $cm cm"
    //% cm.defl=15 cm.min=2 cm.max=100
    //% weight=90 group="Sensors"
    export function onObstacle(cm: number, handler: () => void) {
        if (!_obstacleWatchers) _obstacleWatchers = [];
        _obstacleWatchers.push(new ObstacleWatcher(cm, handler));
        startSensorLoop();
    }

    /**
     * True when the line sensor on this side is over a black line.
     * @param side which sensor to check
     */
    //% blockId=robot_isOnLine block="$side sensor on black line"
    //% weight=85 group="Sensors"
    export function isOnLine(side: Side): boolean {
        const left = isIrLeft(IRState.Black);
        const right = isIrRight(IRState.Black);
        if (side === Side.Left) return left;
        if (side === Side.Right) return right;
        return left && right;
    }

    /**
     * Run some code when the line sensor on this side finds a black line.
     * @param side which sensor to watch
     */
    //% blockId=robot_onLine block="when $side sensor finds black line"
    //% weight=80 group="Sensors"
    export function onLine(side: Side, handler: () => void) {
        if (!_lineWatchers) _lineWatchers = [];
        _lineWatchers.push(new LineWatcher(side, handler));
        startSensorLoop();
    }

    /**
     * True when the left line sensor sees this color.
     */
    //% blockId=robot_isIrLeft block="left sensor sees $state"
    //% weight=75 group="Sensors"
    export function isIrLeft(state: IRState): boolean {
        return maqueen.readPatrol(maqueen.Patrol.PatrolLeft) === state;
    }

    /**
     * True when the right line sensor sees this color.
     */
    //% blockId=robot_isIrRight block="right sensor sees $state"
    //% weight=70 group="Sensors"
    export function isIrRight(state: IRState): boolean {
        return maqueen.readPatrol(maqueen.Patrol.PatrolRight) === state;
    }

    // ---------------------------------------------------------------
    // Lights
    // ---------------------------------------------------------------

    /**
     * Light all four lights under the robot with one color.
     */
    //% blockId=robot_lightBack block="light bottom $color"
    //% weight=100 group="Lights"
    export function lightBack(color?: Colors) {
        strip().showColor(color === undefined ? Colors.Black : color);
    }

    /**
     * Light one of the four lights under the robot.
     * @param index which light, from 0 to 3
     */
    //% blockId=robot_lightBackPixel block="light bottom number $index $color"
    //% index.min=0 index.max=3
    //% weight=95 group="Lights"
    export function lightBackPixel(index: number, color: Colors) {
        const s = strip();
        s.setPixelColor(index, color);
        s.show();
    }

    /**
     * Light the lights under the robot with any color you mix.
     * @param red from 0 to 255
     * @param green from 0 to 255
     * @param blue from 0 to 255
     */
    //% blockId=robot_lightBackRGB block="light bottom red $red green $green blue $blue"
    //% red.min=0 red.max=255 green.min=0 green.max=255 blue.min=0 blue.max=255
    //% inlineInputMode=inline
    //% weight=90 group="Lights"
    export function lightBackRGB(red: number, green: number, blue: number) {
        strip().showColor(neopixel.rgb(red, green, blue));
    }

    /**
     * Show a rainbow on the lights under the robot.
     */
    //% blockId=robot_rainbow block="light bottom rainbow"
    //% weight=85 group="Lights"
    export function rainbow() {
        strip().showRainbow(1, 300);
    }

    /**
     * Flash the lights under the robot a few times.
     */
    //% blockId=robot_blink block="blink $color $times times"
    //% times.defl=3 times.min=1 times.max=20
    //% weight=80 group="Lights"
    export function blink(color: Colors, times: number) {
        for (let i = 0; i < times; i++) {
            strip().showColor(color);
            basic.pause(200);
            strip().showColor(Colors.Black);
            basic.pause(200);
        }
    }

    /**
     * Turn the two red headlights on (any color) or off (black).
     */
    //% blockId=robot_lightFront block="headlights $color"
    //% weight=75 group="Lights"
    export function lightFront(color?: Colors) {
        headlight(Side.Both, color !== undefined && color !== Colors.Black);
    }

    /**
     * Turn a red headlight on or off.
     */
    //% blockId=robot_headlight block="headlight $side $on"
    //% on.shadow=toggleOnOff on.defl=true
    //% weight=70 group="Lights"
    export function headlight(side: Side, on: boolean) {
        const sw = on ? maqueen.LEDswitch.turnOn : maqueen.LEDswitch.turnOff;
        if (side !== Side.Right) maqueen.writeLED(maqueen.LED.LEDLeft, sw);
        if (side !== Side.Left) maqueen.writeLED(maqueen.LED.LEDRight, sw);
    }

    /**
     * Turn off every light on the robot.
     */
    //% blockId=robot_lightsOff block="all lights off"
    //% weight=65 group="Lights"
    export function lightsOff() {
        strip().showColor(Colors.Black);
        headlight(Side.Both, false);
    }

    /**
     * How bright the lights under the robot are. Takes effect the next time
     * you change their color.
     * @param brightness from 0 to 255
     */
    //% blockId=robot_setBrightness block="set light brightness $brightness"
    //% brightness.min=0 brightness.max=255 brightness.defl=128
    //% weight=60 group="Lights"
    export function setBrightness(brightness: number) {
        cfg().brightness = Math.constrain(brightness, 0, 255);
        strip().setBrightness(cfg().brightness);
    }

    // ---------------------------------------------------------------
    // Sound
    // ---------------------------------------------------------------

    /**
     * Play a tune in the background while the robot keeps doing things.
     */
    //% blockId=robot_playMusic block="play music $music"
    //% weight=100 group="Sound"
    export function playMusic(music: Music) {
        startMelody(music);
    }

    /**
     * Beep beep!
     */
    //% blockId=robot_honk block="honk"
    //% weight=95 group="Sound"
    export function honk() {
        music.playTone(Note.A4, music.beat(BeatFraction.Eighth));
        basic.pause(50);
        music.playTone(Note.A4, music.beat(BeatFraction.Quarter));
    }

    /**
     * Stop any music that is playing.
     */
    //% blockId=robot_stopMusic block="stop music"
    //% weight=90 group="Sound"
    export function stopMusic() {
        music.stopMelody(MelodyStopOptions.All);
    }

    // ---------------------------------------------------------------
    // Autopilot: put these inside a "forever" loop
    // ---------------------------------------------------------------

    /**
     * Follow a black line. Put it in a "forever" loop.
     * Uses the speed you set, so slow down if the robot loses the line.
     */
    //% blockId=robot_followLine block="follow black line"
    //% weight=100 group="Autopilot"
    export function followLine() {
        const s = limit(cfg().speed);
        const left = isOnLine(Side.Left);
        const right = isOnLine(Side.Right);
        if (left && right) {
            setWheels(s, s);
        } else if (left) {
            _lastLine = Turn.Left;
            setWheels(0, s);
        } else if (right) {
            _lastLine = Turn.Right;
            setWheels(s, 0);
        } else if (_lastLine === Turn.Left) {
            setWheels(-s / 2, s / 2);
        } else if (_lastLine === Turn.Right) {
            setWheels(s / 2, -s / 2);
        } else {
            // never seen a line yet: roll forward slowly to find one
            setWheels(s / 2, s / 2);
        }
    }

    /**
     * Drive around and steer away from obstacles. Put it in a "forever" loop.
     * @param cm how close an obstacle can get before the robot turns away
     */
    //% blockId=robot_avoidObstacles block="drive and avoid obstacles closer than $cm cm"
    //% cm.defl=15 cm.min=5 cm.max=100
    //% weight=95 group="Autopilot"
    export function avoidObstacles(cm: number = 15) {
        const s = limit(cfg().speed);
        if (isObstacleCloserThan(cm)) {
            setWheels(-s, -s);
            basic.pause(300);
            turn(Math.randomBoolean() ? Turn.Left : Turn.Right, randint(60, 120));
        } else {
            setWheels(s, s);
        }
    }

    /**
     * Follow your hand like a pet! Put it in a "forever" loop.
     * The robot tries to stay about 10 cm away from what is in front of it.
     */
    //% blockId=robot_followObject block="follow my hand"
    //% weight=90 group="Autopilot"
    export function followObject() {
        const s = limit(cfg().speed);
        const d = getObstacleDistance();
        if (d < 7) setWheels(-s / 2, -s / 2);
        else if (d <= 13) setWheels(0, 0);
        else if (d < 40) setWheels(s, s);
        else setWheels(0, 0);
    }

    /**
     * Do a little dance with music and lights.
     */
    //% blockId=robot_dance block="dance"
    //% weight=85 group="Autopilot"
    export function dance() {
        const s = limit(TURN_SPEED + 40);
        startMelody(Music.nyan);
        const colors = [Colors.Red, Colors.Yellow, Colors.Green, Colors.Blue];
        for (let i = 0; i < 4; i++) {
            strip().showColor(colors[i]);
            setWheels(-s, s);
            basic.pause(250);
            setWheels(s, -s);
            basic.pause(250);
        }
        setWheels(s, s);
        basic.pause(200);
        setWheels(-s, -s);
        basic.pause(200);
        setWheels(0, 0);
        rainbow();
    }

    // ---------------------------------------------------------------
    // Remote control over radio (needs two micro:bits)
    // ---------------------------------------------------------------

    /**
     * Use THIS micro:bit as a remote. Tilt it to drive the robot.
     * Use the same group number on the robot.
     * @param radioGroup radio group, from 0 to 255
     */
    //% blockId=robot_startRemoteController block="be a tilt remote on radio group $radioGroup"
    //% radioGroup.defl=1 radioGroup.min=0 radioGroup.max=255
    //% weight=100 group="Remote control"
    export function startRemoteController(radioGroup: number) {
        radio.setGroup(radioGroup);
        control.inBackground(function () {
            while (true) {
                // tilt forward -> forward, tilt right -> turn right
                const throttle = deadZone(-input.acceleration(Dimension.Y));
                const steer = deadZone(input.acceleration(Dimension.X));
                const left = Math.constrain(throttle + steer, -255, 255);
                const right = Math.constrain(throttle - steer, -255, 255);
                radio.sendValue("drive", packWheels(left, right));
                basic.pause(50);
            }
        });
    }

    /**
     * Let a tilt remote drive THIS robot. The robot stops by itself if the
     * remote goes quiet. This uses "on radio received value", so don't use
     * that block for anything else.
     * @param radioGroup radio group, from 0 to 255
     */
    //% blockId=robot_startRemoteReceiver block="drive from remote on radio group $radioGroup"
    //% radioGroup.defl=1 radioGroup.min=0 radioGroup.max=255
    //% weight=95 group="Remote control"
    export function startRemoteReceiver(radioGroup: number) {
        radio.setGroup(radioGroup);
        radio.onReceivedValue(function (name: string, value: number) {
            if (name !== "drive") return;
            const right = (value % 1024) - 256;
            const left = Math.idiv(value, 1024) - 256;
            _remoteLastSeen = control.millis();
            setWheels(limit(left), limit(right));
        });
        control.inBackground(function () {
            while (true) {
                if (_remoteLastSeen && control.millis() - _remoteLastSeen > REMOTE_TIMEOUT_MS) {
                    _remoteLastSeen = 0;
                    setWheels(0, 0);
                }
                basic.pause(100);
            }
        });
    }

    // ---------------------------------------------------------------
    // Settings
    // ---------------------------------------------------------------

    /**
     * Safe: small steps that stop by themselves.
     * Normal: keeps going, but never faster than the max speed.
     * Sport: keeps going at full speed.
     */
    //% blockId=robot_setMode block="set mode $mode"
    //% weight=100 group="Settings"
    export function setMode(mode: Mode) {
        cfg().mode = mode;
    }

    /**
     * True when the robot is in this mode.
     */
    //% blockId=robot_isMode block="mode is $mode"
    //% weight=95 group="Settings"
    export function isMode(mode: Mode): boolean {
        return cfg().mode === mode;
    }

    export function getMode(): Mode {
        return cfg().mode;
    }

    /**
     * How fast the robot drives.
     * @param speed from 0 to 255
     */
    //% blockId=robot_setSpeed block="set speed $speed"
    //% speed.defl=100 speed.min=0 speed.max=255
    //% weight=90 group="Settings"
    export function setSpeed(speed: number) {
        cfg().speed = Math.constrain(speed, 0, 255);
    }

    /**
     * The fastest the robot may go in safe and normal mode.
     * @param maxSpeed from 0 to 255
     */
    //% blockId=robot_setMaxSpeed block="set max speed $maxSpeed"
    //% maxSpeed.defl=150 maxSpeed.min=0 maxSpeed.max=255
    //% weight=85 group="Settings"
    export function setMaxSpeed(maxSpeed: number) {
        cfg().maxSpeed = Math.constrain(maxSpeed, 0, 255);
    }

    /**
     * The most steps one move can take in safe mode.
     * @param maxStep from 1 to 5
     */
    //% blockId=robot_setMaxStep block="set max steps $maxStep"
    //% maxStep.defl=3 maxStep.min=1 maxStep.max=5
    //% weight=80 group="Settings"
    export function setMaxStep(maxStep: number) {
        cfg().maxStep = Math.max(1, maxStep);
    }

    /**
     * Fix a robot that curves when it should go straight.
     * Drifts left? Use a positive number. Drifts right? Use a negative number.
     * @param balance from -50 to 50
     */
    //% blockId=robot_setWheelBalance block="set wheel balance $balance"
    //% balance.defl=0 balance.min=-50 balance.max=50
    //% weight=75 group="Settings"
    export function setWheelBalance(balance: number) {
        cfg().balance = Math.constrain(balance, -50, 50);
    }

    /**
     * How long a 90° turn takes. Make it bigger if "turn" turns too little.
     * @param ms time in milliseconds
     */
    //% blockId=robot_setQuarterTurnTime block="set quarter turn time $ms ms"
    //% ms.defl=400 ms.min=50 ms.max=2000
    //% weight=70 group="Settings"
    export function setQuarterTurnTime(ms: number) {
        cfg().quarterTurnMs = Math.max(0, ms);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    // Drive with the rules of the current mode.
    function drive(left: number, right: number, step: number) {
        const c = cfg();
        setWheels(limit(left), limit(right));
        if (c.mode === Mode.Safe) {
            basic.pause(Math.constrain(step, 1, c.maxStep) * STEP_MS);
            setWheels(0, 0);
        }
    }

    // Cap a signed speed to what the current mode allows.
    function limit(speed: number): number {
        const c = cfg();
        const max = c.mode === Mode.Sport ? 255 : c.maxSpeed;
        return Math.constrain(speed, -max, max);
    }

    // Set both wheels. Speeds are signed: negative means backward.
    function setWheels(left: number, right: number) {
        if (!_motorsReady) {
            // Give the motor board a moment after power-up, so moves at the
            // very start of a program are not lost.
            const t = control.millis();
            if (t < 300) basic.pause(300 - t);
            _motorsReady = true;
        }
        const b = cfg().balance;
        if (b > 0) right = right * (100 - b) / 100;
        else if (b < 0) left = left * (100 + b) / 100;
        setWheel(maqueen.Motors.M1, left);
        setWheel(maqueen.Motors.M2, right);
    }

    function setWheel(motor: maqueen.Motors, speed: number) {
        speed = Math.round(Math.constrain(speed, -255, 255));
        if (speed === 0) maqueen.motorStop(motor);
        else maqueen.motorRun(motor, speed > 0 ? maqueen.Dir.CW : maqueen.Dir.CCW, Math.abs(speed));
    }

    function readDistance(): number {
        const d = maqueen.Ultrasonic(PingUnit.Centimeters);
        return d > 0 ? d : NOTHING_CM;
    }

    function deadZone(v: number): number {
        // accelerometer gives about -1023..1023; ignore small tilts
        if (Math.abs(v) < 150) return 0;
        return Math.constrain(v / 3, -255, 255);
    }

    function packWheels(left: number, right: number): number {
        return (Math.round(left) + 256) * 1024 + (Math.round(right) + 256);
    }

    class Watcher {
        handler: () => void;
        active: boolean;
        busy: boolean;
        constructor(handler: () => void) {
            this.handler = handler;
            this.active = false;
            this.busy = false;
        }
    }

    class ObstacleWatcher extends Watcher {
        cm: number;
        constructor(cm: number, handler: () => void) {
            super(handler);
            this.cm = cm;
        }
    }

    class LineWatcher extends Watcher {
        side: Side;
        constructor(side: Side, handler: () => void) {
            super(handler);
            this.side = side;
        }
    }

    // Run a watcher's handler in its own fiber, skipping it if the previous
    // run hasn't finished, so a slow handler never blocks the sensor loop.
    function fire(w: Watcher) {
        if (w.busy) return;
        w.busy = true;
        control.inBackground(function () {
            w.handler();
            w.busy = false;
        });
    }

    // One background loop reads every sensor, so the ultrasonic sensor is
    // never triggered by two fibers at once.
    function startSensorLoop() {
        if (_sensorLoopStarted) return;
        _sensorLoopStarted = true;
        _distanceAt = 0;
        control.inBackground(function () {
            while (true) {
                if (_obstacleWatchers) {
                    _distance = readDistance();
                    _distanceAt = control.millis();
                    for (const w of _obstacleWatchers) {
                        const near = _distance < w.cm;
                        if (near && !w.active) fire(w);
                        w.active = near;
                    }
                }
                if (_lineWatchers) {
                    for (const w of _lineWatchers) {
                        const on = isOnLine(w.side);
                        if (on && !w.active) fire(w);
                        w.active = on;
                    }
                }
                basic.pause(30);
            }
        });
    }

    function startMelody(m: Music) {
        music.startMelody(music.builtInMelody(melodyOf(m)), MelodyOptions.Once);
    }

    function melodyOf(m: Music): Melodies {
        switch (m) {
            case Music.dadadum: return Melodies.Dadadadum;
            case Music.entertainer: return Melodies.Entertainer;
            case Music.prelude: return Melodies.Prelude;
            case Music.ode: return Melodies.Ode;
            case Music.nyan: return Melodies.Nyan;
            case Music.ringtone: return Melodies.Ringtone;
            case Music.funk: return Melodies.Funk;
            case Music.blues: return Melodies.Blues;
            case Music.birthday: return Melodies.Birthday;
            case Music.wedding: return Melodies.Wedding;
            case Music.funereal: return Melodies.Funeral;
            case Music.punchline: return Melodies.Punchline;
            case Music.baddy: return Melodies.Baddy;
            case Music.chase: return Melodies.Chase;
            case Music.ba_ding: return Melodies.BaDing;
            case Music.wawawawaa: return Melodies.Wawawawaa;
            case Music.jump_up: return Melodies.JumpUp;
            case Music.jump_down: return Melodies.JumpDown;
            case Music.power_up: return Melodies.PowerUp;
            default: return Melodies.PowerDown;
        }
    }
}
