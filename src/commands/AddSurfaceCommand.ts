const positions = [];
const indices = [];
const rows = 50;
const cols = 50;

positions.push(x, y, z);

// set index array (assemble triangle)
for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
        const idx = i * cols + j;
        indices.push(idx, idx + 1, idx + cols);
        indices.push(idx + 1, idx + cols + 1, idx + cols);
    }
}

const mesh = new BABYLON.Mesh("surface", scene);
const vertexData = new BABYLON.VertexData();

vertexData.positions = positions;
vertexData.indices = indices;
vertexData.applyToMesh(mesh, true); // updatable: true

var mat = new BABYLON.StandardMaterial("material", scene);
mat.backFaceCulling = false;
mesh.material = mat;
