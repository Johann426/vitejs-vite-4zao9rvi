import { Arc } from './Arc.js';
import { Nurbs } from './Nurbs.js';
import { NurbsCurve } from './NurbsCurve';
import { NurbsCurveInt } from './NurbsCurveInt';

function splitCurveAt( c, t ) {

	const isMultiple = c.knots.includes( t );

	console.warn( 'not implemented' );

	return [ Nurbs(), Nurbs() ];

}

function bevel( c1, c2 ) {

	console.warn();

}

function round( c1, c2 ) {

	console.warn();

}

export { splitCurveAt };
