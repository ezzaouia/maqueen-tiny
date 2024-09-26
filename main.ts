namespace tiny {

    export enum Mode {
        Safe = 0,
        Normal = 1,
        Sport = 2,
    }

    export enum Direction {
        //% blockId="Run" block="Run"
        Run = 1,
        //% blockId="Back" block="Back"
        Back = 2,
        //% blockId="Left" block="Left"
        Left = 3,
        //% blockId="Right" block="Right"
        Right = 4,
        //% blockId="Stop" block="Stop"
        Stop = 5,
        //% blockId="SpinLeft" block="SpinLeft"
        SpinLeft = 6,
        //% blockId="SpinRight" block="SpinRight"
        SpinRight = 7,
    }

    export enum Music {
        //% blockId="dadadum" block="dadadum"
        dadadum = 0,
        //% blockId="entertainer" block="entertainer"
        entertainer,
        //% blockId="prelude" block="prelude"
        prelude,
        //% blockId="ode" block="ode"
        ode,
        //% blockId="nyan" block="nyan"
        nyan,
        //% blockId="ringtone" block="ringtone"
        ringtone,
        //% blockId="funk" block="funk"
        funk,
        //% blockId="blues" block="blues"
        blues,
        //% blockId="birthday" block="birthday"
        birthday,
        //% blockId="wedding" block="wedding"
        wedding,
        //% blockId="funereal" block="funereal"
        funereal,
        //% blockId="punchline" block="punchline"
        punchline,
        //% blockId="baddy" block="baddy"
        baddy,
        //% blockId="chase" block="chase"
        chase,
        //% blockId="ba_ding" block="ba_ding"
        ba_ding,
        //% blockId="wawawawaa" block="wawawawaa"
        wawawawaa,
        //% blockId="jump_up" block="jump_up"
        jump_up,
        //% blockId="jump_down" block="jump_down"
        jump_down,
        //% blockId="power_up" block="power_up"
        power_up,
        //% blockId="power_down" block="power_down"
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
        //% block=blue
        Blue = 0x0000ff,
        //% block=indigo
        Indigo = 0x4b0082,
        //% block=violet
        Violet = 0x8a2be2,
        //% block=purple
        Purple = 0xff00ff,
        //% block=white
        White = 0xffffff,
        //% block=black
        Black = 0x000000,
    }

    export enum IRState {
        //% blockId="White" block="White Line"
        White = 0,
        //% blockId="Black" block="Black Line"
        Black = 1,
    }

    enum State {
        Idle,
        Moving,
    }

    let strip = neopixel.create(DigitalPin.P15, 4, NeoPixelMode.RGB)
    let _state: State = State.Idle;
    let _mode: Mode = Mode.Safe;
    let _speed: number = 125; // 0 .. 255
    let _maxSpeed = 150;
    let _stepUnit: number = 200; // ms
    let _maxStep = 3;

    //% block
    //% step.defl=1
    //% group="Drive"
    export function move(direction?: Direction, step?: number) {
        motorRun(direction, step);
    }

    //% block
    //% group="Drive"
    export function tank(leftSpeed: number, rightSpeed?: number) {
        motorTank(leftSpeed, rightSpeed || leftSpeed);
    }

    //% block
    //% group="Drive"
    export function stop() {
        setPwmMotor(5, 0, 0);
    }

    //% block
    //% group="Light"
    export function lightBack(color?: Colors) {
        showBackLED(color);
    }

    //% block
    //% group="Light"
    export function lightFront(color?: Colors) {
        showFrontLED(color);
    }

    //% block
    //% group="Music"
    export function playMusic(music: Music) {
        // TODO
    }

    //% block
    //% group="Sensors"
    export function getObstacleDistance(): number {
        return maqueen.Ultrasonic(PingUnit.Centimeters)
    }

    //% block
    //% group="Sensors"
    export function isIrLeft(state: IRState): boolean {
        // TODO
        return false
    }

    //% block
    //% group="Sensors"
    export function isIrRight(state: IRState): boolean {
        // TODO
        return false
    }

    //% block
    //% maxSpeed.defl=150
    //% maxSpeed.min=0 maxSpeed.max=255
    //% group="Setters"
    export function setMaxSpeed(maxSpeed: number) {
        _maxSpeed = maxSpeed;
    }

    //% block
    //% maxStep.defl=3
    //% maxStep.min=1 maxStep.max=5
    //% group="Setters"
    export function setMaxStep(maxStep: number) {
        _maxStep = maxStep;
    }

    //% block
    //% speed.defl=70
    //% speed.min=0 speed.max=255
    //% group="Setters"
    export function setSpeed(speed: number) {
        _speed = speed;
    }

    //% block
    //% mode.defl='safe'
    //% group="Setters"
    export function setMode(mode: Mode) {
        _mode = mode;
    }

    export function getMode() {
        return _mode;
    }

    // helpers
    // ----------

    function motorRun(direction = Direction.Run, step = 1) {
        if (_mode === Mode.Safe) {
            motorRunAdapter(direction, _speed);
            basic.pause(Math.min(step, _maxStep) * _stepUnit);
            motorRunAdapter(Direction.Stop, _speed);
        } else if (_mode === Mode.Normal) {
            motorRunAdapter(direction, Math.min(_speed, _maxSpeed));
        } else {
            motorRunAdapter(direction, _speed);
        }
    }

    function motorRunAdapter(d = Direction.Run, speed?: number) {
        switch (d) {
            case Direction.Run: {
                maqueen.motorRun(maqueen.Motors.All, maqueen.Dir.CW, speed)
                break;
            }
            case Direction.Back: {
                maqueen.motorRun(maqueen.Motors.All, maqueen.Dir.CCW, speed)
                break;
            }
            case Direction.Stop: {
                maqueen.motorStop(maqueen.Motors.All)
                break;
            }
            case Direction.SpinLeft: {
                maqueen.motorStop(maqueen.Motors.M1)
                maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed)
                break;
            }
            case Direction.SpinRight: {
                maqueen.motorStop(maqueen.Motors.M2)
                maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed)
                break;
            }
        }
    }

    function motorTank(left: number, right: number, step = 1) {
        const spin = Math.sign(left) != Math.sign(right);

        if (left === 0 && right === 0) setPwmMotor(0, 0, 0);
        else if (left >= 0 && right >= 0) setPwmMotor(1, left, right, step);
        else if (left <= 0 && right <= 0) setPwmMotor(2, -left, -right, step);
        else if (right > left) {
            if (spin) setPwmMotor(6, Math.abs(left), right, step);
            else setPwmMotor(3, Math.abs(left), right, step);
        } else {
            if (spin) setPwmMotor(7, left, Math.abs(right), step);
            else setPwmMotor(4, left, Math.abs(right), step);
        }
    }

    function getDir(speed: number) {
        return speed >= 0 ? maqueen.Dir.CW : maqueen.Dir.CCW
    }

    function setPwmMotor(d: number, speed1: number, speed2: number, step = 1) {
        if (d < 0 || d > 7) return;


        console.log('== tank : ' + _mode);


        if (_mode === Mode.Safe) {
            motorTanlAdapter(d, speed1, speed2)
            basic.pause(Math.min(step, _maxStep) * _stepUnit);
            motorTanlAdapter(Direction.Stop)
        } else if (_mode === Mode.Normal) {
            speed1 = Math.sign(speed1) * Math.min(Math.abs(speed1), _maxSpeed);
            speed2 = Math.sign(speed2) * Math.min(Math.abs(speed2), _maxSpeed);
            motorTanlAdapter(d, speed1, speed2)
        } else {
            motorTanlAdapter(d, speed1, speed2)
        }
    }

    function motorTanlAdapter(d = Direction.Run, speed1?: number, speed2?: number) {
        switch (d) {
            case Direction.Run: {
                maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed1)
                maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed2)
                break;
            }
            case Direction.Back: {
                maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, speed1)
                maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, speed2)
                break;
            }
            case Direction.Stop: {
                maqueen.motorStop(maqueen.Motors.All)
                break;
            }
            case Direction.SpinLeft: {
                maqueen.motorStop(maqueen.Motors.M1)
                maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed2)
                break;
            }
            case Direction.SpinRight: {
                maqueen.motorStop(maqueen.Motors.M2)
                maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed1)
                break;
            }
        }
    }

    function showBackLED(c?: Colors): void {
        if (!c) {
            showColor(c)
        } else {
            showColor(c)
        }
    }



    function showFrontLED(c?: Colors): void {
        if (!c) {
            maqueen.writeLED(maqueen.LED.LEDLeft, maqueen.LEDswitch.turnOff)
            maqueen.writeLED(maqueen.LED.LEDRight, maqueen.LEDswitch.turnOff)
        } else {
            maqueen.writeLED(maqueen.LED.LEDLeft, maqueen.LEDswitch.turnOn)
            maqueen.writeLED(maqueen.LED.LEDRight, maqueen.LEDswitch.turnOn)
        }
    }

    function showColor(c: Colors) {
        c = c >> 0;
        const { red, green, blue } = setAllRGB(c);
        strip.showColor(neopixel.rgb(red, green, blue))
    }

    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xff;
        return r;
    }

    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xff;
        return g;
    }

    function unpackB(rgb: number): number {
        let b = rgb & 0xff;
        return b;
    }

    function setAllRGB(rgb: number) {
        let red = unpackR(rgb);
        let green = unpackG(rgb);
        let blue = unpackB(rgb);
        return { red, green, blue };
    }
}

