class Caminante {

    constructor(nx, ny, dir) {
        this.x = nx + random(-3, 3);
        this.y = ny + random(-3, 3);
        this.dir = dir;
        this.velBase = 1.2 + random(1.2);

        this.vida = 600;
        this.recorrido = 0;
        this.dead = false;

        this.estado = 'recta';
        this.anguloGiro = radians(random(3, 8)) * (random(1) < 0.5 ? 1 : -1);
        this.cuenta = int(random(8, 35));

        this.noiseOffset = random(1000);

        this.px = this.x;
        this.py = this.y;

        this.esGrueso = random(1) < 0.25;

        this.targetNucleus = null;
        this.pickTarget();
    }

    pickTarget() {
        let far = nuclei.filter(n => dist(this.x, this.y, n.x, n.y) > width * 0.2);
        this.targetNucleus = far.length > 0 ? random(far) : random(nuclei);
    }

    lerpAngle(a, b, t) {
        let d = b - a;
        while (d > PI)  d -= TWO_PI;
        while (d < -PI) d += TWO_PI;
        return a + d * t;
    }

    actualizar(velBoost) {
        if (velBoost === undefined) velBoost = 1;
        this.px = this.x;
        this.py = this.y;

        let vel = this.velBase * velBoost;

        let noiseVal = noise(this.x * 0.003, this.y * 0.003, this.noiseOffset);
        let noisePush = map(noiseVal, 0, 1, -radians(2), radians(2));
        this.noiseOffset += 0.006;

        if (this.estado === 'recta') {
            this.cuenta--;
            if (this.cuenta <= 0) {
                // modoCaos: más quiebres abruptos y más angulares
                // fluido: más curvas suaves
                let probQuiebre = modoCaos ? 0.65 : 0.25;
                if (random(1) < probQuiebre) {
                    let rango = modoCaos ? random(70, 115) : random(50, 85);
                    let angBrusco = radians(rango) * (random(1) < 0.5 ? 1 : -1);
                    this.dir += angBrusco;
                    this.estado = 'recta';
                    this.cuenta = int(random(6, modoCaos ? 20 : 30));
                } else {
                    this.estado = 'curva';
                    let maxAng = modoCaos ? 12 : 6;
                    this.anguloGiro = radians(random(2, maxAng)) * (random(1) < 0.5 ? 1 : -1);
                    this.cuenta = int(random(10, modoCaos ? 25 : 40));
                }
            }
        } else if (this.estado === 'curva') {
            this.dir += this.anguloGiro;
            this.anguloGiro += random(-radians(0.5), radians(0.5));
            let limAng = modoCaos ? 14 : 8;
            this.anguloGiro = constrain(this.anguloGiro, radians(-limAng), radians(limAng));
            this.cuenta--;
            if (this.cuenta <= 0) {
                this.estado = 'recta';
                this.cuenta = int(random(8, 35));
            }
        }

        this.dir += noisePush;

        if (this.targetNucleus) {
            let angTarget = atan2(this.targetNucleus.y - this.y, this.targetNucleus.x - this.x);
            let distTarget = dist(this.x, this.y, this.targetNucleus.x, this.targetNucleus.y);
            let atrac = map(distTarget, 0, 400, 0.001, 0.025);
            this.dir = this.lerpAngle(this.dir, angTarget, atrac);
            if (distTarget < 35) this.pickTarget();
        }

        let fr = 55;
        if (this.x < fr)           this.dir = this.lerpAngle(this.dir, 0,        map(this.x, 0, fr, 0.2, 0));
        if (this.x > width - fr)   this.dir = this.lerpAngle(this.dir, PI,       map(this.x, width - fr, width, 0, 0.2));
        if (this.y < fr)           this.dir = this.lerpAngle(this.dir, HALF_PI,  map(this.y, 0, fr, 0.2, 0));
        if (this.y > height - fr)  this.dir = this.lerpAngle(this.dir, -HALF_PI, map(this.y, height - fr, height, 0, 0.2));

        this.x += vel * cos(this.dir);
        this.y += vel * sin(this.dir);
        this.x = constrain(this.x, 2, width - 2);
        this.y = constrain(this.y, 2, height - 2);

        let paso = dist(this.x, this.y, this.px, this.py);
        this.recorrido += paso;
        if (this.recorrido >= this.vida) this.dead = true;
    }

    dibujar() {
        let minDist = Infinity;
        for (let n of nuclei) {
            let d = dist(this.x, this.y, n.x, n.y);
            if (d < minDist) minDist = d;
        }

        let maxR = (width / (COLS + 1)) * 0.9;
        let zonaGruesa = maxR * 0.3;

        let sw, alpha;

        if (minDist < zonaGruesa) {
            let swBase = map(minDist, 0, zonaGruesa, 5.0, 2.0, true);
            let boost  = this.esGrueso ? map(minDist, 0, zonaGruesa, 5.0, 0.0, true) : 0;
            sw    = swBase + boost;
            alpha = map(minDist, 0, zonaGruesa, 230, 180, true);
        } else {
            sw    = map(minDist, zonaGruesa, maxR, 2.0, 0.6, true);
            alpha = map(minDist, zonaGruesa, maxR, 180, 120, true);
        }

        stroke(20, 18, 30, alpha);
        strokeWeight(sw);
        line(this.px, this.py, this.x, this.y);
    }
}