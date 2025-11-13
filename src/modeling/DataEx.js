class DataEx {

	constructor( filename ) {

		this.filetype = filetype( filename );

		function filetype( filename ) {

			const ext = filename.toLowerCase().split( '.' ).pop();

			switch ( ext ) {

				case 'iges':

				case 'igs':
					return 'iges';

				default:
					console.warn( 'Not supported file type' );
					return undefined;

			}

		}

	}

	toJson( model ) {

		const object = model.selected;

		if ( object === null ) {

			alert( 'No object selected' );
			return;

		}

		let output = object.toJSON();

		try {

			output = JSON.stringify( output, null, '\t' );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, 'model.json' );


	}

	IGES( editor ) {

		const model = editor.obj3d.pickable;
		const layerName = editor.modeltree.layerName;
		const arr = []; // array of string to be written in IGES format
		const Ceil = Math.ceil;

		// Start Section
		let i = 1;
		arr.push( 'Prologue'.padEnd( 72 ) + 'S' + i.toString().padStart( 7 ) + '\r\n' );
		let ter = new String();
		ter += 'S' + i.toString().padStart( 7, '0' );

		// Global Section
		const date = new Date().toISOString();
		const global = {

			parameterDelimiter: ',',
			RecordDelimiter: ';',
			product: 'ProductID', //for sending system
			fileName: 'fileName',
			sw: 'SoftwareID',
			ver: 'Preprocessor ver',
			binaryBit: 32,
			maxPowerFloat: 38,
			significantDigitsFloat: 7,
			maxPowerDouble: 308,
			significantDigitsDouble: 15,
			product2: '', //for receiving system
			scale: '',
			unitFlag: 6, //unit: meters
			unitName: 'M',
			maxLineWeight: 1,
			maxLineWidth: 0.001,
			dateAndTime: date.slice( 0, 10 ).replace( /-/g, '' ) + '.' + date.slice( 11, 19 ).replace( /:/g, '' ), //GMT
			minResolution: 0.0001,
			maxCoord: '',
			nameAuthor: 'jwlee',
			organization: 'companyName',
			verFlag: 11, //IGES 5.3 (1996)
			standardFlag: 1, //ISO
			dateAndTimeModel: '',
			protocol: '',

		};

		let str = new String();

		for ( const key in global ) {

			const val = global[ key ];

			switch ( typeof val ) {

				case 'string':
					val.length === 0 ? str += ',' : str += val.length + 'H' + val + ',';
					break;

				case 'number':
					Number.isInteger( val ) ? str += val + ',' : str += val + 'D0,';
					break;

				case 'boolean':
					break;

				default:
					str += ',';

			}

		}

		str += ';';
		i = 1;
		str.match( /.{1,72}/g ).map( e => {

			arr.push( e.padEnd( 72 ) + 'G' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;

		} );

		ter += 'G' + ( i - 1 ).toString().padStart( 7, '0' );

		// Directory Entry Section
		i = 1;
		let pn = 1;
		let ptr = new String(); // pointer to Parameter Data Section
		const color = [];
		const lines = [];
		const surfs = [];
		const group = layerName.slice(); // to be used in level definition (Type 406, Form 3)

		model.children.map( e => {

			const c = e.material.color;
			let rgb = 'RGB(';
			rgb += ( c.r * 255 ).toFixed( 0 ).padStart( 4 ) + ',';
			rgb += ( c.g * 255 ).toFixed( 0 ).padStart( 4 ) + ',';
			rgb += ( c.b * 255 ).toFixed( 0 ).padStart( 4 ) + ' )';
			rgb = rgb.length + 'H' + rgb;
			rgb = ( c.b * 100 ).toFixed( 1 ) + ',' + rgb;
			rgb = ( c.g * 100 ).toFixed( 1 ) + ',' + rgb;
			rgb = ( c.r * 100 ).toFixed( 1 ) + ',' + rgb;

			if ( ! color.includes( rgb ) ) color.push( rgb );

			switch ( e.type ) {

				case 'Line':
					e.curve.rgb = rgb;
					e.curve.layer = e.layers.mask;
					lines.push( e.curve );
					break;

				case 'Mesh':
					e.surface.rgb = rgb;
					surfs.push( e.surface );
					break;

			}

		} );

		for ( let j = 0; j < color.length; j ++ ) { // Color Definition (Type 314)

			ptr = pn.toString();
			const stat = '00000200'; // 00: visible, 00: Independent, 02: Definition, 00:Hierarchy
			const row1 = '     314' + ptr.padStart( 8 ) + '       0' + '       0' + '       0' + '       0' + '       0' + '       0' + stat;
			const row2 = '     314' + '       0' + '       0' + '       1' + '       0' + '       0' + '       0' + '   Color' + stat;
			arr.push( row1 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			arr.push( row2 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			pn ++;

		}

		for ( let j = 0; j < group.length; j ++ ) { // Level Property (Type 406, Form 3)

			ptr = pn.toString();
			const stat = '00000300'; // 00: visible, 00: Independent, 03: Other, 00:Hierarchy
			const row1 = '     406' + ptr.padStart( 8 ) + '       0' + '       0' + ( j + 1 ).toString().padStart( 8 ) + '       0' + '       0' + '       0' + stat;
			const row2 = '     406' + '       0' + '       0' + '       1' + '       3' + '       0' + '       0' + group[ j ].padStart( 8 ) + stat;
			arr.push( row1 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			arr.push( row2 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			pn ++;

		}

		for ( let j = 0; j < lines.length; j ++ ) { // loop over lines

			const line = lines[ j ];
			ptr = pn.toString();
			const l = line.layer + 1; // level (layer) number
			const c = - ( color.indexOf( line.rgb ) * 2 + 1 ); // negated pointer to Color Definition
			const n = 1 + Ceil( line.knots.length / 3 ) + Ceil( line.ctrlPoints.length / 3 ) + line.ctrlPoints.length + 1; // line count of Parameter Data Section
			const stat = '00000000'; // 00: visible, 00: Independent, 00: Geometry, 00:Hierarchy
			const row1 = '     126' + ptr.padStart( 8 ) + '       0' + '       0' + l.toString().padStart( 8 ) + '       0' + '       0' + '       0' + stat;
			const row2 = '     126' + '       0' + c.toString().padStart( 8 ) + n.toString().padStart( 8 ) + '       0' + '       0' + '       0' + '   Lines' + stat;
			arr.push( row1 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			arr.push( row2 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			pn += n;

		}

		for ( let j = 0; j < surfs.length; j ++ ) { // loop over surfaces

			//const ptr =
			const s = surfs[ j ];
			ptr = pn.toString();
			const l = color.indexOf( s.rgb );
			const c = - ( l * 2 + 1 );
			const n = 1 + Ceil( s.knot[ 0 ].length / 3 ) + Ceil( s.knot[ 1 ].length / 3 ) + Ceil( s.weights.length / 3 ) + s.ctrlPoints.length + 2;
			const stat = '00000000'; // 00: visible, 00: Independent, 00: Geometry, 00:Hierarchy
			const row1 = '     128' + ptr.padStart( 8 ) + '       0' + '       0' + l.toString().padStart( 8 ) + '       0' + '       0' + '       0' + stat;
			const row2 = '     128' + '       0' + c.toString().padStart( 8 ) + n.toString().padStart( 8 ) + '       0' + '       0' + '       0' + '   Surfs' + stat;
			arr.push( row1 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			arr.push( row2 + 'D' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;
			pn += n;

		}

		ter += 'D' + ( i - 1 ).toString().padStart( 7, '0' );

		// Parameter Data Section
		i = 1;
		ptr = new String(); // pointer to Directory Entry

		function write() {

			arr.push( str.padEnd( 64 ) + ' ' + ptr.padStart( 7, '0' ) + 'P' + i.toString().padStart( 7 ) + '\r\n' );
			i ++;

		}

		for ( let j = 0; j < color.length; j ++ ) { // loop over color (Type 314)

			ptr = ( j * 2 + 1 ).toString();
			str = '314,' + color[ j ] + ';';
			write();

		}

		for ( let j = 0; j < group.length; j ++ ) { // loop over group (Type 406, Form 3)

			ptr = ( j * 2 + 1 + color.length * 2 ).toString();
			str = '406,2,' + ( j + 1 ).toString() + ',' + group[ j ].length + 'H' + group[ j ]; + ';';
			write();

		}

		for ( let j = 0; j < lines.length; j ++ ) { // loop over lines

			const l = lines[ j ];
			const deg = l.deg;
			const knot = l.knots;
			const ctrl = l.ctrlPoints;
			const wts = l.weights;
			ptr = ( j * 2 + 1 + color.length * 2 + group.length * 2 ).toString();
			str = '126,' + ( ctrl.length - 1 ).toString() + ',' + deg + ',' + '0,0,0,0,'; //'1,0,1,0,'
			write();

			knot.map( ( e, k ) => {

				const num = e.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				k % 3 == 0 ? str = num : str += num;

				if ( k % 3 == 2 ) {

					write();

				} else {

					k === knot.length - 1 ? write() : null;

				}

			} );

			ctrl.map( ( e, k )=> {

				const w = wts === undefined ? 1.0 : wts[ k ];
				const num = w.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				k % 3 == 0 ? str = num : str += num;

				if ( k % 3 == 2 ) {

					write();

				} else {

					k === ctrl.length - 1 ? write() : null;

				}

			} );

			ctrl.map( e => {

				const x = e.x.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				const y = e.y.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				const z = e.z.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				str = x + y + z;
				write();

			} );

			const start = knot[ 0 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
			const end = knot[ knot.length - 1 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ';';
			str = start + end;
			write();

		}

		for ( let j = 0; j < surfs.length; j ++ ) { // loop over surfaces

			const s = surfs[ j ];
			const deg = s.deg;
			const knot = s.knot;
			const ctrl = s.ctrlPoints;
			const ni = knot[ 0 ].length - deg[ 0 ] - 1;
			const nj = knot[ 1 ].length - deg[ 1 ] - 1;
			const wts = s.weights;

			str = '128,' + [ ni - 1, nj - 1 ].toString() + ',' + deg.toString() + ',' + '1,1,0,0,0,'; //'0,0,1,0,0,'
			ptr = ( j * 2 + 1 + color.length * 2 + group.length * 2 + lines.length * 2 ).toString();
			write();

			knot[ 0 ].map( ( e, k ) => {

				const num = e.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				k % 3 == 0 ? str = num : str += num;

				if ( k % 3 == 2 ) {

					write();

				} else {

					k === knot[ 0 ].length - 1 ? write() : null;

				}

			} );

			knot[ 1 ].map( ( e, k ) => {

				const num = e.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
				k % 3 == 0 ? str = num : str += num;

				if ( k % 3 == 2 ) {

					write();

				} else {

					k === knot[ 1 ].length - 1 ? write() : null;

				}

			} );

			wts.map( w => {

				w.map( ( e, k ) => {

					const num = e.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
					k % 3 == 0 ? str = num : str += num;

					if ( k % 3 == 2 ) {

						write();

					} else {

						k === w.length - 1 ? write() : null;

					}

				} );

			} );

			ctrl.map( p => {

				p.map( e => {

					const x = e.x.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
					const y = e.y.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
					const z = e.z.toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
					str = x + y + z;
					write();

				} );

			} );

			const s0 = knot[ 0 ][ 0 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
			const e0 = knot[ 0 ][ knot[ 0 ].length - 1 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
			str = s0 + e0;
			write();
			const s1 = knot[ 1 ][ 0 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ',';
			const e1 = knot[ 1 ][ knot[ 1 ].length - 1 ].toExponential( 14 ).toString().replace( 'e', 'D' ) + ';';
			str = s1 + e1;
			write();

		}

		ter += 'P' + ( i - 1 ).toString().padStart( 7, '0' );

		// Terminate Section
		i = 1;
		arr.push( ter.padEnd( 72 ) + 'T' + i.toString().padStart( 7 ) + '\r\n' );

		const x = document.createElement( 'input' );
		x.value = 'Save File';
		document.body.appendChild( x );
		x.addEventListener( 'click', saveFile );
		x.click();

		async function saveFile() {

			// CREATE BLOB OBJECT
			var myBlob = new Blob( arr, { type: "text/plain" } );

			// // FILE HANDLER & FILE STREAM
			// const fileHandle = await window.showSaveFilePicker( {
			// 	types: [ {
			// 		description: "IGES file",
			// 		accept: { "IGES/plain": [ '.iges', '.igs' ] } //accept: { "text/plain": [ ".txt" ] }
			// 	} ]
			// } );
			// const fileStream = await fileHandle.createWritable();

			// // WRITE FILE
			// await fileStream.write( myBlob );
			// await fileStream.close();

			const link = document.createElement( 'a' );

			link.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( await myBlob.text() ) );
			link.setAttribute( 'download', 'lines.iges' );
			link.style.display = 'none';

			document.body.appendChild( link );

			link.click();

			document.body.removeChild( link );

		}

	}

}

function saveString( text, filename ) {

	save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}

function save( blob, filename ) {

	if ( link.href ) {

		URL.revokeObjectURL( link.href );

	}

	link.href = URL.createObjectURL( blob );
	link.download = filename || 'data.json';
	link.dispatchEvent( new MouseEvent( 'click' ) );

}

const link = document.createElement( 'a' );

export { DataEx };
