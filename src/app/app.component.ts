import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt, parse
} from 'mathjs'

enum SYNC_TYPE {
  H,
  N,
}

enum SPEED_TPYE {
  SLOW = 'slow',
  MEDIUM = 'medium',
  FAST = 'fast'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  desc: string;
  title = 'mod-sim-tpo';

  functionFG: FormGroup;

  functionControl: AbstractControl;
  xInitialControl: AbstractControl;
  tInitialControl: AbstractControl;
  tFinalControl: AbstractControl;
  hControl: AbstractControl;
  nControl: AbstractControl;
  speedControl: AbstractControl;

  speedOptions: string[] = ['slow', 'medium', 'fast'];

  maxX;
  minX;

  interval: any;

  constructor(private fb: FormBuilder) {}

  dataToShow = [];

  public graph = {
    data: [
      {
        x: [],
        y: [],
        type: 'scatter',
        name: 'Euler',
        mode: 'lines+points+markers',
        marker: { color: '#F6C85F' },
      },
      {
        x: [],
        y: [],
        type: 'scatter',
        name: 'Euler mejorado',
        mode: 'lines+points+markers',
        marker: { color: '#9CD966' },
      },
      {
        x: [],
        y: [],
        type: 'scatter',
        name: 'Runge Kutta',
        mode: 'lines+points+markers',
        marker: { color: '#6E4E7D' },
      },
    ],
    layout: {
      height: window.innerHeight,
      title: '',
      showlegend: true,
      font: {
        family: 'sans-serif',
        size: 20,
      },
      legend: { orientation: 'h' },
      xaxis: { range: [0, 10], title: { text: 't', size: 30 } },
      yaxis: { range: [0, 10], title: { text: 'x', size: 30 } },
    },
  };

  ngOnInit(): void {
    this.functionFG = this.fb.group({
      functionControl: ['sin(t)', [Validators.required]],
      xInitialControl: [0, [Validators.required]],
      tInitialControl: [0, [Validators.required]],
      tFinalControl: [10, [Validators.required]],
      hControl: [1, [Validators.required]],
      nControl: [10, [Validators.required]],
      speedControl: ['medium', [Validators.required]],
    });

    this.functionControl = this.functionFG.get('functionControl');
    this.xInitialControl = this.functionFG.get('xInitialControl');
    this.tInitialControl = this.functionFG.get('tInitialControl');
    this.tFinalControl = this.functionFG.get('tFinalControl');
    this.hControl = this.functionFG.get('hControl');
    this.nControl = this.functionFG.get('nControl');
    this.speedControl = this.functionFG.get('speedControl');

    this.tInitialControl.valueChanges.subscribe((value) => {
      if (this.nControl.valid && this.hControl.value) {
        this.syncAmount(SYNC_TYPE.N);
      }
    });

    this.tFinalControl.valueChanges.subscribe((value) => {
      if (this.nControl.valid && this.hControl.value) {
        this.syncAmount(SYNC_TYPE.N);
      }
    });
  }

  syncAmount(type: number) {
    if (this.tInitialControl.valid && this.tFinalControl.valid) {
      if (type === SYNC_TYPE.H) {
        this.hControl.setValue(
          (this.tFinalControl.value - this.tInitialControl.value) /
            this.nControl.value
        );
      } else {
        this.nControl.setValue(
          (this.tFinalControl.value - this.tInitialControl.value) /
            this.hControl.value
        );
      }
    }
  }

  calculate(showGraph: boolean = true) {
    this.functionFG.markAllAsTouched();
    if (this.functionFG.status === 'VALID') {
      this.graph.layout.xaxis.range = [
        this.tInitialControl.value < 0
          ? this.tInitialControl.value * 1.1
          : this.tInitialControl.value,
        this.tFinalControl.value < 0
          ? this.tFinalControl.value * 0.9
          : this.tFinalControl.value * 1.1,
      ];

      this.calculateEuler();
      this.calculateBetterEuler();
      this.calculateRungeKutta();

      this.graph.layout.yaxis.range = [
        this.minX < 0 ? this.minX * 1.2 : this.minX * 0.8,
        this.maxX < 0 ? this.maxX * 0.8 : this.maxX * 1.2,
      ];

      if (showGraph) {
        this.showInGraph();
      }
    }
  }

  play() {
    clearInterval(this.interval);
    this.calculate(false);
    const times = this.nControl.value + 1;
    let current = 0;

    const eulerXs = [...this.graph.data[0].x];
    const eulerYs = [...this.graph.data[0].y];
    const betterEulerXs = [...this.graph.data[1].x];
    const betterEulerYs = [...this.graph.data[1].y];
    const rungeKuttaXs = [...this.graph.data[2].x];
    const rungeKuttaYs = [...this.graph.data[2].y];

    this.graph.data.forEach((d) => {
      d.x = [];
      d.y = [];
    });

    const speed = this.getSpeed();

    this.interval = setInterval(() => {
      if (current > times) {
        clearInterval(this.interval);
      } else {
        this.graph.data.forEach((d) => {
          d.x = [];
          d.y = [];
          if (d.name === 'Euler') {
            d.x = eulerXs.slice(0, current);
            d.y = eulerYs.slice(0, current);
          }
          if (d.name === 'Euler mejorado') {
            d.x = betterEulerXs.slice(0, current);
            d.y = betterEulerYs.slice(0, current);
          }
          if (d.name === 'Runge Kutta') {
            d.x = rungeKuttaXs.slice(0, current);
            d.y = rungeKuttaYs.slice(0, current);
          }
        });
        current += 1;
        this.showInGraph();
      }
    }, speed);
  }

  getSpeed() {
    switch (this.speedControl.value) {
      case SPEED_TPYE.SLOW:
        return 300;
      case SPEED_TPYE.MEDIUM:
        return 150;
      case SPEED_TPYE.FAST:
        return 10;
      default:
        return 10;
    }
  }

  reset() {
    clearInterval(this.interval);
    this.graph.data.forEach((d) => {
      d.x = [];
      d.y = [];
    });
  }

  showInGraph() {
    this.dataToShow = [...this.graph.data];
  }

  calculateEuler() {
    this.graph.data[0].x = [];
    this.graph.data[0].y = [];

    const expression = parse(this.functionControl.value);

    let x = this.xInitialControl.value;
    let t = this.tInitialControl.value;
    const h = this.hControl.value;

    this.graph.data[0].x.push(t);
    this.graph.data[0].y.push(x);

    this.maxX = x;
    this.minX = x;

    for (let i = 0; i < this.nControl.value; i++) {
      console.log(expression.evaluate({ t: t, x: x }));
      x = x + h * +expression.evaluate({ t: t, x: x });
      t = t + h;
      this.graph.data[0].x.push(t);
      this.graph.data[0].y.push(x);
      if (x > this.maxX) {
        this.maxX = x;
      }
      if (x < this.minX) {
        this.minX = x;
      }
    }
  }

  calculateBetterEuler() {
    this.graph.data[1].x = [];
    this.graph.data[1].y = [];
    const expression = parse(this.functionControl.value);

    let x = this.xInitialControl.value;
    let t = this.tInitialControl.value;
    const h = this.hControl.value;

    this.graph.data[1].x.push(t);
    this.graph.data[1].y.push(x);

    for (let i = 0; i < this.nControl.value; i++) {
      console.log(expression.evaluate({ t: t, x: x }));
      const evaluatedExp = +expression.evaluate({ t: t, x: x });
      const prediction = x + h * evaluatedExp;
      t = t + h;
      x =
        x +
        (h / 2) *
          (evaluatedExp + +expression.evaluate({ t: t, x: prediction }));
      this.graph.data[1].x.push(t);
      this.graph.data[1].y.push(x);
      if (x > this.maxX) {
        this.maxX = x;
      }
      if (x < this.minX) {
        this.minX = x;
      }
    }
  }

  calculateRungeKutta() {
    this.graph.data[2].x = [];
    this.graph.data[2].y = [];
    const expression = parse(this.functionControl.value);

    let x = this.xInitialControl.value;
    let t = this.tInitialControl.value;
    const h = this.hControl.value;

    this.graph.data[2].x.push(t);
    this.graph.data[2].y.push(x);

    for (let i = 0; i < this.nControl.value; i++) {
      const f1 = +expression.evaluate({
        t: t,
        x: x,
      });
      const f2 = +expression.evaluate({
        t: t + h / 2,
        x: x + (f1 * h) / 2,
      });
      const f3 = +expression.evaluate({
        t: t + h / 2,
        x: x + (f2 * h) / 2,
      });
      const f4 = +expression.evaluate({
        t: t + h,
        x: x + f3 * h,
      });

      x = x + ((f1 + 2 * f2 + 2 * f3 + f4) / 6) * h;
      t = t + h;

      this.graph.data[2].x.push(t);
      this.graph.data[2].y.push(x);
      if (x > this.maxX) {
        this.maxX = x;
      }
      if (x < this.minX) {
        this.minX = x;
      }
    }
  }
}
