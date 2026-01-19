import fs from 'fs';
import path from 'path';

const DEG_TO_RAD = Math.PI / 180;

const quatFromAxisAngle = (axis, angle) => {
  const half = angle / 2;
  const sin = Math.sin(half);
  return [axis[0] * sin, axis[1] * sin, axis[2] * sin, Math.cos(half)];
};

const ROTATE_X_90 = quatFromAxisAngle([1, 0, 0], 90 * DEG_TO_RAD);

const createBoxGeometry = () => ({
  positions: [
    // Front face (+Z)
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,
    -0.5, 0.5, 0.5,
    // Back face (-Z)
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5,
    // Left face (-X)
    -0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    -0.5, 0.5, -0.5,
    // Right face (+X)
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,
    0.5, 0.5, 0.5,
    // Top face (+Y)
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,
    // Bottom face (-Y)
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, -0.5, 0.5,
    -0.5, -0.5, 0.5
  ],
  normals: [
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0
  ],
  indices: [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ]
});

const createCylinderGeometry = (segments = 24) => {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * 0.5;
    const z = Math.sin(angle) * 0.5;
    positions.push(x, 0.5, z, x, -0.5, z);
    normals.push(x, 0, z, x, 0, z);
  }

  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    const top = i * 2;
    const bottom = i * 2 + 1;
    const nextTop = next * 2;
    const nextBottom = next * 2 + 1;
    indices.push(top, bottom, nextTop, nextTop, bottom, nextBottom);
  }

  const topCenterIndex = positions.length / 3;
  positions.push(0, 0.5, 0);
  normals.push(0, 1, 0);
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * 0.5;
    const z = Math.sin(angle) * 0.5;
    positions.push(x, 0.5, z);
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    indices.push(topCenterIndex, topCenterIndex + 1 + i, topCenterIndex + 1 + next);
  }

  const bottomCenterIndex = positions.length / 3;
  positions.push(0, -0.5, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * 0.5;
    const z = Math.sin(angle) * 0.5;
    positions.push(x, -0.5, z);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    indices.push(bottomCenterIndex, bottomCenterIndex + 1 + next, bottomCenterIndex + 1 + i);
  }

  return { positions, normals, indices };
};

const geometries = {
  box: createBoxGeometry(),
  cylinder: createCylinderGeometry(28)
};

const materials = [
  {
    name: 'Enclosure',
    pbrMetallicRoughness: { baseColorFactor: [0.72, 0.72, 0.74, 0.25], metallicFactor: 0, roughnessFactor: 0.85 },
    alphaMode: 'BLEND'
  },
  {
    name: 'Cover',
    pbrMetallicRoughness: { baseColorFactor: [0.96, 0.97, 0.99, 0.35], metallicFactor: 0, roughnessFactor: 0.4 },
    alphaMode: 'BLEND'
  },
  {
    name: 'Diffuser',
    pbrMetallicRoughness: { baseColorFactor: [0.94, 0.97, 1, 0.45], metallicFactor: 0, roughnessFactor: 0.2 },
    alphaMode: 'BLEND'
  },
  {
    name: 'PCB',
    pbrMetallicRoughness: { baseColorFactor: [0.12, 0.5, 0.28, 1], metallicFactor: 0.1, roughnessFactor: 0.7 }
  },
  {
    name: 'Battery',
    pbrMetallicRoughness: { baseColorFactor: [0.12, 0.32, 0.7, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'MCU',
    pbrMetallicRoughness: { baseColorFactor: [0.18, 0.18, 0.2, 1], metallicFactor: 0.4, roughnessFactor: 0.5 }
  },
  {
    name: 'GNSS',
    pbrMetallicRoughness: { baseColorFactor: [0.18, 0.55, 0.58, 1], metallicFactor: 0.1, roughnessFactor: 0.6 }
  },
  {
    name: 'Antenna',
    pbrMetallicRoughness: { baseColorFactor: [0.82, 0.82, 0.84, 1], metallicFactor: 0.3, roughnessFactor: 0.4 }
  },
  {
    name: 'Charger',
    pbrMetallicRoughness: { baseColorFactor: [0.95, 0.72, 0.18, 1], metallicFactor: 0.1, roughnessFactor: 0.5 }
  },
  {
    name: 'Contacts',
    pbrMetallicRoughness: { baseColorFactor: [0.9, 0.78, 0.3, 1], metallicFactor: 0.6, roughnessFactor: 0.3 }
  },
  {
    name: 'Button',
    pbrMetallicRoughness: { baseColorFactor: [0.35, 0.35, 0.35, 1], metallicFactor: 0.2, roughnessFactor: 0.7 }
  },
  {
    name: 'Haptic',
    pbrMetallicRoughness: { baseColorFactor: [0.92, 0.48, 0.18, 1], metallicFactor: 0.1, roughnessFactor: 0.5 }
  },
  {
    name: 'Speaker',
    pbrMetallicRoughness: { baseColorFactor: [0.6, 0.6, 0.62, 1], metallicFactor: 0.3, roughnessFactor: 0.4 }
  },
  {
    name: 'LED',
    pbrMetallicRoughness: { baseColorFactor: [0.15, 0.9, 0.25, 1], metallicFactor: 0.05, roughnessFactor: 0.3 }
  },
  {
    name: 'Strap',
    pbrMetallicRoughness: { baseColorFactor: [0.18, 0.18, 0.25, 1], metallicFactor: 0, roughnessFactor: 0.9 }
  },
  {
    name: 'WireRed',
    pbrMetallicRoughness: { baseColorFactor: [0.85, 0.2, 0.2, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'WireBlack',
    pbrMetallicRoughness: { baseColorFactor: [0.1, 0.1, 0.1, 1], metallicFactor: 0, roughnessFactor: 0.8 }
  },
  {
    name: 'WireBlue',
    pbrMetallicRoughness: { baseColorFactor: [0.25, 0.45, 0.9, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'WireGreen',
    pbrMetallicRoughness: { baseColorFactor: [0.2, 0.8, 0.45, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'WireYellow',
    pbrMetallicRoughness: { baseColorFactor: [0.95, 0.82, 0.2, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'WirePurple',
    pbrMetallicRoughness: { baseColorFactor: [0.62, 0.3, 0.7, 1], metallicFactor: 0, roughnessFactor: 0.6 }
  },
  {
    name: 'FlexCable',
    pbrMetallicRoughness: { baseColorFactor: [0.7, 0.7, 0.7, 1], metallicFactor: 0.1, roughnessFactor: 0.8 }
  }
];

const materialIndex = new Map(materials.map((material, index) => [material.name, index]));

const buildStrapSegments = () => {
  const segments = [];
  const strapCount = 16;
  const radiusX = 2.1;
  const radiusY = 0.95;
  const yTop = -0.32;
  for (let i = 0; i < strapCount; i += 1) {
    const progress = i / (strapCount - 1);
    const t = progress * Math.PI;
    const x = radiusX * Math.cos(t);
    const y = yTop - radiusY * Math.sin(t);
    const dx = -radiusX * Math.sin(t);
    const dy = -radiusY * Math.cos(t);
    const angle = Math.atan2(dy, dx);
    segments.push({
      name: `Strap Segment ${i + 1}`,
      geometry: 'box',
      material: 'Strap',
      translation: [x, y, 0],
      scale: [0.45, 0.08, 1.25],
      rotation: quatFromAxisAngle([0, 0, 1], angle)
    });
  }
  return segments;
};

const strapSegments = buildStrapSegments();

const parts = [
  { name: 'Enclosure Base', geometry: 'box', material: 'Enclosure', translation: [0, -0.2, 0], scale: [3.0, 0.4, 1.8] },
  { name: 'Top Cover', geometry: 'box', material: 'Cover', translation: [0, 0.5, 0], scale: [2.6, 0.18, 1.6] },
  { name: 'Diffuser', geometry: 'box', material: 'Diffuser', translation: [0, 0.52, 0], scale: [1.6, 0.06, 0.7] },
  { name: 'Main PCB', geometry: 'box', material: 'PCB', translation: [0, -0.03, 0], scale: [2.2, 0.07, 1.3] },
  { name: 'ESP32-S3', geometry: 'box', material: 'MCU', translation: [0.55, 0.06, 0.25], scale: [0.8, 0.12, 0.45] },
  { name: 'GNSS Module', geometry: 'box', material: 'GNSS', translation: [-0.6, 0.05, -0.25], scale: [0.7, 0.12, 0.45] },
  { name: 'GNSS Antenna', geometry: 'box', material: 'Antenna', translation: [0, 0.16, 0.68], scale: [1.2, 0.05, 0.2] },
  { name: 'GNSS UART Pads', geometry: 'box', material: 'Contacts', translation: [-0.5, 0.12, -0.2], scale: [0.2, 0.02, 0.06] },
  { name: 'I2C Pads', geometry: 'box', material: 'Contacts', translation: [0.05, 0.12, -0.1], scale: [0.2, 0.02, 0.08] },
  { name: 'LED Pads', geometry: 'box', material: 'Contacts', translation: [0.35, 0.43, 0], scale: [0.12, 0.02, 0.12] },
  { name: 'LiPo Battery', geometry: 'box', material: 'Battery', translation: [0, -0.18, 0], scale: [1.8, 0.18, 0.8] },
  { name: 'Battery JST', geometry: 'box', material: 'Button', translation: [0.2, -0.16, 0.35], scale: [0.2, 0.06, 0.12] },
  { name: 'USB-C Charger', geometry: 'box', material: 'Charger', translation: [0, -0.05, 0.95], scale: [0.9, 0.12, 0.3] },
  { name: 'USB-C Port', geometry: 'box', material: 'Button', translation: [0, -0.05, 1.1], scale: [0.25, 0.08, 0.08] },
  { name: 'Charging Pads', geometry: 'box', material: 'Contacts', translation: [0.4, -0.34, 0.05], scale: [0.25, 0.03, 0.25] },
  { name: 'Side Button', geometry: 'box', material: 'Button', translation: [1.5, 0.05, 0], scale: [0.15, 0.15, 0.3] },
  { name: 'Haptic Driver', geometry: 'box', material: 'Haptic', translation: [-0.75, -0.05, -0.15], scale: [0.35, 0.08, 0.25] },
  { name: 'Haptic Motor', geometry: 'cylinder', material: 'Haptic', translation: [-0.9, -0.1, -0.2], scale: [0.18, 0.06, 0.18] },
  { name: 'Speaker Amp', geometry: 'box', material: 'Speaker', translation: [0.8, -0.05, 0.25], scale: [0.35, 0.08, 0.25] },
  { name: 'Speaker', geometry: 'cylinder', material: 'Speaker', translation: [0.9, -0.1, 0.2], scale: [0.22, 0.08, 0.22] },
  { name: 'Status LED', geometry: 'cylinder', material: 'LED', translation: [0.35, 0.46, 0], scale: [0.06, 0.06, 0.06] },
  { name: 'Fastener', geometry: 'cylinder', material: 'Contacts', translation: [1.1, 0.32, 0.6], scale: [0.05, 0.12, 0.05] },
  { name: 'Flex Cable', geometry: 'box', material: 'FlexCable', translation: [0.15, -0.08, -0.15], scale: [0.3, 0.02, 0.2] },
  {
    name: 'Wire Battery +',
    geometry: 'cylinder',
    material: 'WireRed',
    translation: [0.15, -0.18, 0.45],
    scale: [0.025, 0.7, 0.025],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire Battery -',
    geometry: 'cylinder',
    material: 'WireBlack',
    translation: [-0.15, -0.18, 0.45],
    scale: [0.025, 0.7, 0.025],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire GNSS UART',
    geometry: 'cylinder',
    material: 'WireBlue',
    translation: [-0.1, 0.05, 0.0],
    scale: [0.02, 0.6, 0.02],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire I2C',
    geometry: 'cylinder',
    material: 'WireGreen',
    translation: [0.05, 0.02, -0.05],
    scale: [0.02, 0.5, 0.02],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire Haptic',
    geometry: 'cylinder',
    material: 'WireYellow',
    translation: [-0.83, -0.08, -0.18],
    scale: [0.02, 0.25, 0.02],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire LED',
    geometry: 'cylinder',
    material: 'WireGreen',
    translation: [0.3, 0.3, 0],
    scale: [0.015, 0.2, 0.015],
    rotation: ROTATE_X_90
  },
  {
    name: 'Wire Speaker',
    geometry: 'cylinder',
    material: 'WirePurple',
    translation: [0.85, -0.08, 0.22],
    scale: [0.02, 0.2, 0.02],
    rotation: ROTATE_X_90
  },
  ...strapSegments
];

const bufferViews = [];
const accessors = [];
const bufferChunks = [];
let byteOffset = 0;

const appendBufferView = (typedArray, target) => {
  const chunk = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  const viewIndex = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset, byteLength: chunk.length, target });
  bufferChunks.push(chunk);
  byteOffset += chunk.length;
  return viewIndex;
};

const buildAccessor = (viewIndex, componentType, count, type, min, max) => {
  const accessorIndex = accessors.length;
  const accessor = { bufferView: viewIndex, componentType, count, type };
  if (min) accessor.min = min;
  if (max) accessor.max = max;
  accessors.push(accessor);
  return accessorIndex;
};

const geometryAccessors = {};

Object.entries(geometries).forEach(([name, geometry]) => {
  const positions = new Float32Array(geometry.positions);
  const normals = new Float32Array(geometry.normals);
  const indices = new Uint16Array(geometry.indices);

  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    min = [
      Math.min(min[0], positions[i]),
      Math.min(min[1], positions[i + 1]),
      Math.min(min[2], positions[i + 2])
    ];
    max = [
      Math.max(max[0], positions[i]),
      Math.max(max[1], positions[i + 1]),
      Math.max(max[2], positions[i + 2])
    ];
  }

  const positionView = appendBufferView(positions, 34962);
  const normalView = appendBufferView(normals, 34962);
  const indexView = appendBufferView(indices, 34963);

  geometryAccessors[name] = {
    position: buildAccessor(positionView, 5126, positions.length / 3, 'VEC3', min, max),
    normal: buildAccessor(normalView, 5126, normals.length / 3, 'VEC3'),
    indices: buildAccessor(indexView, 5123, indices.length, 'SCALAR')
  };
});

const meshes = parts.map((part) => {
  const access = geometryAccessors[part.geometry];
  return {
    name: `${part.name} Mesh`,
    primitives: [
      {
        attributes: { POSITION: access.position, NORMAL: access.normal },
        indices: access.indices,
        material: materialIndex.get(part.material)
      }
    ]
  };
});

const nodes = parts.map((part, index) => {
  const node = {
    name: part.name,
    mesh: index,
    translation: part.translation,
    scale: part.scale
  };
  if (part.rotation) {
    node.rotation = part.rotation;
  }
  return node;
});

const gltf = {
  asset: {
    version: '2.0',
    generator: 'tbay-assembly-proxy-v2'
  },
  scene: 0,
  scenes: [{ nodes: nodes.map((_, index) => index) }],
  nodes,
  meshes,
  materials,
  buffers: [
    {
      byteLength: byteOffset,
      uri: `data:application/octet-stream;base64,${Buffer.concat(bufferChunks).toString('base64')}`
    }
  ],
  bufferViews,
  accessors
};

const outputPath = path.join(process.cwd(), 'public', 'models', 'tbay-bracelet.gltf');
fs.writeFileSync(outputPath, `${JSON.stringify(gltf, null, 2)}\n`);
console.log(`Wrote proxy model to ${outputPath}`);
