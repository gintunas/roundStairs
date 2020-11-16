$(function () {
    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 1000);
    // const helper = new THREE.CameraHelper(camera);
    // scene.add(helper);

    var renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setClearColor(0xEEEEEE, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // var axes = new THREE.AxesHelper(100);
    // scene.add(axes);

    var planeGeometry = new THREE.PlaneGeometry(200, 200);
    var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    planeMaterial.side = THREE.DoubleSide;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0
    plane.position.y = 0
    plane.position.z = 0

    scene.add(plane);

    function makePlane2Shape() {
        const plane2Shape = new THREE.Shape();
        plane2Shape.moveTo(0, 0);
        plane2Shape.lineTo(0, 200);
        plane2Shape.lineTo(200, 200);
        plane2Shape.lineTo(200, 0);
        plane2Shape.lineTo(0, 0);
        return plane2Shape;
    }

    camera.position.x = 40;
    camera.position.y = 40;
    camera.position.z = 40;
    camera.lookAt(scene.position);

    var spotLight = new THREE.SpotLight(0xffffff, 1.1);
    spotLight.angle = Math.PI / 2 * 0.83;
    spotLight.position.set(0, height - stepHeight, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048; // default is 512
    spotLight.shadow.mapSize.height = 2048; // default is 512
    scene.add(spotLight);

    // var spotLight2 = new THREE.SpotLight(0xffffff);
    // spotLight2.angle = Math.PI / 2 * 0.83;
    // spotLight2.position.set(0, (height*2), 0);
    // spotLight2.castShadow = true;
    // spotLight2.shadow.mapSize.width = 2048; // default is 512
    // spotLight2.shadow.mapSize.height = 2048; // default is 512
    // scene.add(spotLight2);

    // const spotLightHelper2 = new THREE.SpotLightHelper(spotLight2);
    // scene.add(spotLightHelper2);

    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);

    const light = new THREE.AmbientLight(0x404040, 1.8);
    scene.add(light);

    $("#WebGL-output").append(renderer.domElement);
    var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);

    var controls = new function () {
        this.stepsNumber = 10;
        this.rotationAngle = 150;
        this.axisX = 30;
        this.axisZ = 30;
        this.radius = 20;

        this.asGeom = function () {
            scene.remove(changingObjects);
            scene.remove(plane2);
            scene.remove(bbox)
            scene.remove(box)

            var options = {
                stepsNumber: controls.stepsNumber,
                rotationAngle: controls.rotationAngle,
                axisX: controls.axisX,
                axisZ: controls.axisZ,
                radius: controls.radius
            };

            changingObjects = drawRoundStaircase(options);
            bbox = new THREE.Box3().setFromObject(changingObjects);

            let hole = new THREE.Shape()
            hole.moveTo(100 + bbox.min.x, 100 - bbox.min.z)
            hole.lineTo(100 + bbox.min.x, 100 - bbox.max.z)
            hole.lineTo(100 + bbox.max.x, 100 - bbox.max.z)
            hole.lineTo(100 + bbox.max.x, 100 - bbox.min.z)
            hole.lineTo(100 + bbox.min.x, 100 - bbox.min.z)

            var plane2Shape = makePlane2Shape();
            plane2Shape.holes.push(hole)
            const planeGeometry2 = new THREE.ShapeGeometry(plane2Shape);
            planeGeometry2.computeVertexNormals();

            plane2 = new THREE.Mesh(planeGeometry2, planeMaterial);
            plane2.castShadow = true;
            plane2.receiveShadow = true;
            plane2.rotation.x = -0.5 * Math.PI;
            plane2.position.x = -100
            plane2.position.y = height + stepHeight
            plane2.position.z = 100

            step.updateMatrixWorld();
            scene.add(plane2)
            scene.add(changingObjects);
        };
    }

    var gui = new dat.GUI();
    gui.add(controls, 'stepsNumber', 6, 20).step(1).onChange(controls.asGeom);
    gui.add(controls, 'rotationAngle', 66, 360).onChange(controls.asGeom);
    gui.add(controls, 'axisX', -100, 100).onChange(controls.asGeom);
    gui.add(controls, 'axisZ', -100, 100).onChange(controls.asGeom);
    gui.add(controls, 'radius', 0, 50).onChange(controls.asGeom);

    let changingObjects;
    let plane2;
    let bbox;
    let box;

    controls.asGeom();
    render();

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
        trackballControls.update();
    }
});

const goldenRatio = (1 + Math.sqrt(5)) / 2;
const stepHeight = goldenRatio / 3;

function drawCurve(points, width, curveOptions) {

    const group = new THREE.Group();

    const curve = new THREE.CatmullRomCurve3(points);

    if (curveOptions) {
        curve.curveType = curveOptions.curveType;
        curve.tension = curveOptions.tension;
    }

    const geom = new THREE.TubeBufferGeometry(curve, 66, width, 21, false);
    const mesh = new THREE.Mesh(geom, chromeMaterial);
    mesh.castShadow = true;
    group.add(mesh);

    var pos = geom.attributes.position;
    var startPoints = [];
    startPoints.push(curve.getPoint(0));
    for (let i = 0; i <= geom.parameters.radialSegments; i++) {
        startPoints.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }

    var pointsStartGeom = new THREE.BufferGeometry().setFromPoints(startPoints);
    var psgPos = pointsStartGeom.attributes.position;
    var indexStart = [];
    for (let i = 1; i < psgPos.count - 1; i++) {
        indexStart.push(0, i, i + 1);
    }
    pointsStartGeom.setIndex(indexStart);

    var shapeStart = new THREE.Mesh(pointsStartGeom, chromeMaterial);
    group.add(shapeStart);

    var endPoints = [];
    endPoints.push(curve.getPoint(1));
    for (let i = (geom.parameters.radialSegments + 1) * geom.parameters.tubularSegments; i < pos.count; i++) {
        endPoints.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }

    var pointsEndGeom = new THREE.BufferGeometry().setFromPoints(endPoints);
    var pegPos = pointsEndGeom.attributes.position;
    var indexEnd = [];
    for (let i = 1; i < pegPos.count - 1; i++) {
        indexEnd.push(0, i + 1, i);
    }
    pointsEndGeom.setIndex(indexEnd);

    var shapeEnd = new THREE.Mesh(pointsEndGeom, chromeMaterial);
    group.add(shapeEnd);
    return group;
}


const r = "https://threejs.org/examples/textures/cube/Bridge2/";
const urls = [
    r + "posx.jpg", r + "negx.jpg",
    r + "posy.jpg", r + "negy.jpg",
    r + "posz.jpg", r + "negz.jpg"
];

const chromeMap = new THREE.CubeTextureLoader().load(urls);
chromeMap.format = THREE.RGBFormat;
const chromeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    envMap: chromeMap,
    specular: 0xffffff,
    shininess: 100
})

function drawPole(length, width) {
    const geometry = new THREE.CylinderGeometry(width, width, length, 32);
    let transformationMatrix = new THREE.Matrix4().makeTranslation(0.5, length / 2, 0.5);
    geometry.applyMatrix4(transformationMatrix);
    cylinder = new THREE.Mesh(geometry, chromeMaterial);
    cylinder.castShadow = true;
    return cylinder
}

const length = 8, thickness = 1 / goldenRatio;
function drawStep(seqNo, zero = false) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, length / goldenRatio);
    shape.bezierCurveTo(width / goldenRatio, length, 1 / 7 * width, length, 0, length)
    shape.lineTo(0, 0);

    const extrudeSettings = {
        depth: stepHeight,
        bevelEnabled: true,
        bevelThickness: thickness,
        bevelSize: thickness,
        bevelSegments: 21
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    let transformationMatrix = new THREE.Matrix4().makeTranslation(thickness, thickness, length + thickness);
    transformationMatrix.multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    let group = new THREE.Group();
    if (seqNo % 2 == 0) {
        transformationMatrix.multiply(new THREE.Matrix4().makeTranslation(width, 0, stepHeight))
        transformationMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
        let points =
            [
                new THREE.Vector3(width + thickness * 2 + 0.5, poleHeight, length / 2 + thickness),
                new THREE.Vector3(width + thickness * 2 + 0.5, -stepHeight / 2 - 0.25, length / 2 + thickness),
                new THREE.Vector3(width / 2, -stepHeight / 2 - 0.25, length / 2 + thickness)
            ]

        const options = {
            curveType: "catmullrom",
            tension: 0,
        }

        if(!zero) group.add(drawCurve(points, 0.5, options))
    }
    geometry.applyMatrix4(transformationMatrix);
    let material = new THREE.MeshLambertMaterial({ color: 0x606060 });
    if(zero) material = new THREE.MeshLambertMaterial({ color: 0xcde7f0 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);
    if (seqNo == 1) {
        let pole = drawPole(11, 3);
        pole.position.set(width / 2, -stepHeight * 2 - 9.5, length / 2 + thickness)
        group.add(pole)
    }
    else {
        let pole = drawPole(2.5, 3);
        pole.position.set(width / 2, -stepHeight * 2 - 1, length / 2 + thickness)
        group.add(pole)
        let poleH = drawPole(0.1, 1);
        poleH.position.set(width / 2, -stepHeight * 2, length / 2 + thickness + 1.5)
        group.add(poleH)
    }
    return group;
}

function getPointOnCircle(x, y, radius, alpha) {
    xn = x + radius * Math.cos(alpha);
    yn = y + radius * Math.sin(alpha);
    return new THREE.Vector2(xn, yn);
}

const height = 50;
const width = 15;
const poleHeight = 22;

function drawRoundStaircase(options) {
    let handrailPoints = [];
    let constructionPoints = [];

    let angle = Math.PI / 180 * options.rotationAngle;
    let angleBetweenSteps = angle / (options.stepsNumber - 1);
    let heightBetweenSteps = height / (options.stepsNumber - 1);
    const group = new THREE.Group();

    pos = getPointOnCircle(options.axisX, options.axisZ, options.radius + (width + 2 * thickness) * Math.cos(angleBetweenSteps), angleBetweenSteps);
    handrailPoints.push(new THREE.Vector3(pos.x, poleHeight, pos.y))

    for (let i = 0; i < options.stepsNumber; i++) {
        if(i ==0){
            step = drawStep(i, true);
            h = heightBetweenSteps * i;
            posStep = getPointOnCircle(options.axisX, options.axisZ, options.radius, angleBetweenSteps * i);
            step.position.set(posStep.x, h, posStep.y);
            step.rotation.y = -angleBetweenSteps * i;
            group.add(step);            
            i++;
        } 
        step = drawStep(i);
        h = heightBetweenSteps * i;
        posStep = getPointOnCircle(options.axisX, options.axisZ, options.radius, angleBetweenSteps * i);
        step.position.set(posStep.x, h, posStep.y);
        step.rotation.y = -angleBetweenSteps * i;
        group.add(step);
        step.updateMatrixWorld();

        bbox = new THREE.Box3().setFromObject(step.children[step.children.length - 1]);

        if (i == 1) {
            vecH = bbox.getCenter(new THREE.Vector3)
            vecH.y = h - 1.5;
            constructionPoints.push(vecH)
        } else {
            vecL = bbox.getCenter(new THREE.Vector3)
            vecL.y = h - heightBetweenSteps * 1.2;
            constructionPoints.push(vecL)

            vecH = bbox.getCenter(new THREE.Vector3)
            vecH.y = h - stepHeight - heightBetweenSteps * 0.1;
            constructionPoints.push(vecH)
        }
        if (i % 2 == 0) {
            bbox = new THREE.Box3().setFromObject(step.children[0].children[1]);
            handrailPoints.push(bbox.getCenter(new THREE.Vector3))
        }
    }

    i = options.stepsNumber + 1;
    pos = getPointOnCircle(options.axisX, options.axisZ, options.radius + (width + 3 * thickness) * Math.cos(angleBetweenSteps), angleBetweenSteps * (i + 1));
    handrailPoints.push(new THREE.Vector3(pos.x, poleHeight + heightBetweenSteps * (i - 1), pos.y))

    group.add(drawCurve(handrailPoints, 0.75))
    group.add(drawCurve(constructionPoints, 1, {
        curveType: "catmullrom",
        tension: 0.2
    }))
    return group;
}