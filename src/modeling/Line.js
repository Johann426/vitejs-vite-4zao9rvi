import { parameterize, assignKnot, Vector } from './NurbsLib.js';
import { Bspline } from "./Bspline.js";

class Line extends Bspline {

	constructor() {

		super( 1 );

		this.pole = [];

	}

	get ctrlPoints() {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return this.ctrlp;

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	get parameter() {

		return this.prm;

	}

	add( v ) {

		this.pole.push( { point: new Vector( v.x, v.y, v.z ) } );
		this.needsUpdate = true;

	}

	remove( i ) {

		const removed = this.pole.splice( i, 1 );
		this.needsUpdate = true;
		return removed[ 0 ].point;

	}

	mod( i, v ) {

		this.pole[ i ].point = new Vector( v.x, v.y, v.z );
		this.needsUpdate = true;

	}

	incert( i, v ) {

		this.pole.splice( i, 0, { point: new Vector( v.x, v.y, v.z ) } );
		this.needsUpdate = true;

	}

	incertPointAt( t, v ) {

		if ( t > 0.0 && t < 1.0 ) {

			const i = this.prm.findIndex( e => e > t );
			this.incert( i, v );

		}

	}

	incertClosestPoint( v ) {

		const e = this.closestPosition( v );
		const t = e[ 0 ];
		const p = e[ 1 ];

		if ( t > 0.0 && t < 1.0 ) {

			const i = this.prm.findIndex( e => e > t );
			this.incert( i, p );

		} else if ( t == 0 ) {

			this.incert( 0, v );

		} else if ( t == 1 ) {

			this.add( v );

		}

		return t;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return super.getPointAt( t );

	}

	_calcCtrlPoints() {

		const pts = this.pole.map( e => e.point );
		this.prm = parameterize( pts, 'chordal' );
		this.knots = assignKnot( this.deg, this.prm );
		this.ctrlp = pts;
		this.needsUpdate = false;

	}

}

export { Line };
