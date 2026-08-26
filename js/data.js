/* ============================================
   MOCK DATA — ASUNAMA Land Records Verification System
   150 Parcels — Village: Ponneri, District: Thiruvallur, Tamil Nadu (Chennai Region)
   Pipeline: VTOL Drone → ODM Orthomosaic → U-Net Boundary
             → PostGIS Spatial Comparison → Change/Conflict Analysis
   ============================================ */

const VILLAGE_INFO = {
    name: 'Ponneri',
    district: 'Thiruvallur',
    state: 'Tamil Nadu',
    block: 'Ponneri-TK',
    mouza: 'Ponneri',
    jlNo: '112',
    surveyDate: '2025-05-26',
    totalParcels: 150,
    corsStation: 'CORS-TN-CHE-01 (Chennai)',
};

// Center coordinates for the village (Ponneri, Thiruvallur, Tamil Nadu - near Chennai)
const MAP_CENTER = [13.3120, 80.1950];
const MAP_ZOOM = 16;

// PostGIS-aligned discrepancy types
const DISCREPANCY_TYPES = [
    'Area Discrepancy (ODM vs RoR)',
    'Spatial Boundary Mismatch',
    'Boundary Mismatch + Area Discrepancy',
    'Encroachment Detected',
    'Area Discrepancy + Encroachment',
    'Parcel Overlap (Topology)',
    'Shape Distortion (Legacy Survey)'
];

// Conflict types from PythonQGIS analysis
const CONFLICT_TYPES = [
    'Boundary Encroachment',
    'Unregistered Construction',
    'Water Body Encroachment',
    'Road/Path Deviation',
    'Vegetation Cover Change',
    'Unauthorized Land Use Change'
];

// Verification statuses
const VERIFICATION_STATUSES = ['Pending', 'In Progress', 'Verified', 'Rejected'];

// Surveyor names
const SURVEYORS = [
    'Amit Sharma', 'Priya Das', 'Rajesh Kumar', 'Sunita Ghosh',
    'Debashis Mondal', 'Ananya Chatterjee', 'Suresh Halder', 'Mousumi Roy'
];

// Recommended actions
const ACTIONS_LIST = [
    'Update Boundary', 'Re-survey Required', 'Update Area Records',
    'Field Inspection', 'Encroachment Removal', 'Legal Review',
    'No Action Needed', 'Boundary Demarcation'
];

// RTK Fix types
const RTK_FIX_TYPES = ['RTK Fixed', 'RTK Float', 'PPK Corrected', 'DGPS'];

// U-Net boundary extraction status
const AI_EXTRACTION_STATUS = ['Clean', 'Vegetation Obstruction', 'Shadow Interference', 'Partial Cloud Cover'];

// Seed random for reproducibility
function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const rand = seededRandom(42);

function randomInt(min, max) {
    return Math.floor(rand() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(rand() * arr.length)];
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

// Generate ULPIN (Unique Land Parcel Identification Number)
// Format: SS-DD-BBB-MMMMM-PPPPP (State-District-Block-Mouza-Parcel)
function generateULPIN(index) {
    const state = '33'; // Tamil Nadu
    const district = '01'; // Thiruvallur
    const block = '045'; // Ponneri
    const mouza = '00112'; // Ponneri
    const parcel = String(index + 1).padStart(5, '0');
    return `${state}-${district}-${block}-${mouza}-${parcel}`;
}

// Generate parcel polygons in a grid-like layout
function generateParcelGeometry(index) {
    const cols = 10;
    const row = Math.floor(index / cols);
    const col = index % cols;

    const baseLat = 13.3080;
    const baseLng = 80.1900;
    const cellH = 0.0008;
    const cellW = 0.0010;

    const jitterLat = randomFloat(-0.00008, 0.00008, 6);
    const jitterLng = randomFloat(-0.00010, 0.00010, 6);

    const lat0 = baseLat + row * cellH + jitterLat;
    const lng0 = baseLng + col * cellW + jitterLng;

    // Create irregular quadrilateral (RoR boundary)
    const rorCoords = [
        [lat0, lng0],
        [lat0, lng0 + cellW + randomFloat(-0.00012, 0.00012, 6)],
        [lat0 + cellH + randomFloat(-0.00008, 0.00008, 6), lng0 + cellW + randomFloat(-0.00012, 0.00012, 6)],
        [lat0 + cellH + randomFloat(-0.00008, 0.00008, 6), lng0 + randomFloat(-0.00006, 0.00006, 6)]
    ];

    // UAV boundary — shifted slightly from RoR (U-Net extracted)
    const shiftFactor = randomFloat(0.00002, 0.00015, 6);
    const shiftDir = rand() > 0.5 ? 1 : -1;
    const uavCoords = rorCoords.map(c => [
        c[0] + randomFloat(-0.00004, 0.00004, 6) * shiftDir,
        c[1] + shiftFactor * shiftDir + randomFloat(-0.00003, 0.00003, 6)
    ]);

    const centerLat = rorCoords.reduce((s, c) => s + c[0], 0) / 4;
    const centerLng = rorCoords.reduce((s, c) => s + c[1], 0) / 4;

    return { rorCoords, uavCoords, center: [centerLat, centerLng] };
}

// Generate score with realistic distribution
function generateScore(index) {
    const r = rand();
    if (r < 0.28) return randomFloat(2, 20);
    if (r < 0.62) return randomFloat(21, 40);
    if (r < 0.85) return randomFloat(41, 60);
    return randomFloat(61, 98);
}

function getScoreCategory(score) {
    if (score <= 20) return 'low';
    if (score <= 40) return 'moderate';
    if (score <= 60) return 'high';
    return 'very-high';
}

function getScoreColor(score) {
    if (score <= 20) return '#27ae60';
    if (score <= 40) return '#f0b429';
    if (score <= 60) return '#e67e22';
    return '#e74c3c';
}

function getScoreLabel(score) {
    if (score <= 20) return 'Low';
    if (score <= 40) return 'Moderate';
    if (score <= 60) return 'High';
    return 'Very High';
}

// Owner names pool
const OWNER_NAMES = [
    'Ramesh Mandal', 'Anil Biswas', 'Tapan Sarkar', 'Gopal Pramanik',
    'Kamal Naskar', 'Bidhan Haldar', 'Sunil Bera', 'Dulal Ghosh',
    'Prabir Maji', 'Mrinal Kandu', 'Shankar Das', 'Nikhil Roy',
    'Tarun Bag', 'Jyoti Mondal', 'Bikash Saha', 'Partha Dey'
];

const PREV_OWNERS = [
    'Haripada Mandal', 'Sudhir Biswas', 'Ashok Sarkar', 'Ratan Pramanik',
    'Lakshman Naskar', 'Sanat Haldar', 'Dipak Bera', 'Mantu Ghosh'
];

// Generate mutation records
function generateMutationRecords(ownerName) {
    const prevOwner = randomChoice(PREV_OWNERS);
    const mutYear = randomInt(2015, 2024);
    const mutType = randomChoice(['Inheritance', 'Sale', 'Gift', 'Partition', 'Court Order']);
    return [
        {
            date: `${mutYear}-${String(randomInt(1,12)).padStart(2,'0')}-${String(randomInt(1,28)).padStart(2,'0')}`,
            type: mutType,
            from: prevOwner,
            to: ownerName,
            deedNo: `RG-${randomInt(1000, 9999)}/${mutYear}`,
            registrationDate: `${mutYear}-${String(randomInt(1,12)).padStart(2,'0')}-${String(randomInt(1,28)).padStart(2,'0')}`,
        }
    ];
}

// Generate AI confidence — lower for obstructed parcels
function generateAIConfidence(score) {
    if (score > 60) return randomFloat(72, 89);
    if (score > 40) return randomFloat(82, 94);
    return randomFloat(91, 99);
}

// Generate IoU (Intersection over Union) score
function generateIoU(score) {
    if (score > 60) return randomFloat(0.45, 0.72);
    if (score > 40) return randomFloat(0.65, 0.85);
    return randomFloat(0.85, 0.98);
}

// Generate all 150 parcels
function generateParcels() {
    const parcels = [];

    for (let i = 0; i < 150; i++) {
        const id = 101 + i;
        const rorArea = randomFloat(800, 3000);
        const score = generateScore(i);
        const category = getScoreCategory(score);

        const diffPercent = randomFloat(-35, 35);
        const surveyArea = parseFloat((rorArea * (1 + diffPercent / 100)).toFixed(2));
        const areaDiff = parseFloat((surveyArea - rorArea).toFixed(2));

        const geometry = generateParcelGeometry(i);

        // Status correlates with score
        let status;
        if (score > 60) {
            status = rand() > 0.3 ? 'Pending' : randomChoice(['In Progress', 'Verified']);
        } else if (score > 40) {
            status = randomChoice(['Pending', 'In Progress', 'Verified']);
        } else {
            status = rand() > 0.2 ? 'Verified' : randomChoice(['Pending', 'In Progress']);
        }

        // PostGIS-aligned types
        let type;
        if (score > 60) {
            type = randomChoice(['Boundary Mismatch + Area Discrepancy', 'Area Discrepancy + Encroachment', 'Encroachment Detected']);
        } else if (score > 40) {
            type = randomChoice(['Area Discrepancy (ODM vs RoR)', 'Spatial Boundary Mismatch', 'Boundary Mismatch + Area Discrepancy']);
        } else {
            type = randomChoice(['Area Discrepancy (ODM vs RoR)', 'Spatial Boundary Mismatch', 'Shape Distortion (Legacy Survey)']);
        }

        const surveyor = randomChoice(SURVEYORS);
        const action = score > 40 ? randomChoice(ACTIONS_LIST.slice(0, 6)) : randomChoice(ACTIONS_LIST.slice(4));
        const ownerName = randomChoice(OWNER_NAMES);

        // Verification date
        const dayOffset = randomInt(1, 30);
        const verDate = new Date(2025, 4, 26 - dayOffset);

        // AI and spatial data
        const aiConfidence = generateAIConfidence(score);
        const iouScore = generateIoU(score);
        const rtkFixType = randomChoice(RTK_FIX_TYPES);
        const aiExtractionStatus = score > 50 ? randomChoice(AI_EXTRACTION_STATUS.slice(1)) : AI_EXTRACTION_STATUS[0];

        // RTK accuracy in cm (1-5 cm for RTK Fixed, 5-15 cm for Float, etc.)
        let gpsAccuracyCm;
        if (rtkFixType === 'RTK Fixed') gpsAccuracyCm = randomFloat(1.2, 3.5, 1);
        else if (rtkFixType === 'PPK Corrected') gpsAccuracyCm = randomFloat(2.0, 5.0, 1);
        else if (rtkFixType === 'RTK Float') gpsAccuracyCm = randomFloat(8.0, 15.0, 1);
        else gpsAccuracyCm = randomFloat(30, 80, 1);

        // Survey mission link
        const missionId = `MSN-${String(Math.floor(i / 25) + 1).padStart(3, '0')}`;

        // Conflict type (for high-score parcels)
        const conflictType = score > 40 ? randomChoice(CONFLICT_TYPES) : null;

        // Elevation
        const elevation = randomFloat(8, 22, 1);
        const terrainType = elevation > 15 ? 'Elevated' : elevation < 10 ? 'Low-lying' : 'Flat';

        parcels.push({
            id: id,
            parcelId: String(id),
            ulpin: generateULPIN(i),
            rorArea: rorArea,
            surveyArea: surveyArea,
            areaDiff: areaDiff,
            areaDiffPercent: parseFloat(diffPercent.toFixed(2)),
            score: parseFloat(score.toFixed(1)),
            category: category,
            type: type,
            status: status,
            geometry: geometry,
            // RTK/PPK GPS data
            rtkFixType: rtkFixType,
            gpsAccuracyCm: gpsAccuracyCm,
            corsStation: VILLAGE_INFO.corsStation,
            // AI/U-Net data
            aiConfidence: aiConfidence,
            aiExtractionStatus: aiExtractionStatus,
            boundaryMethod: 'U-Net v2 Segmentation',
            // PostGIS spatial data
            iouScore: iouScore,
            spatialComparisonEngine: 'PostGIS 3.4',
            // Conflict analysis
            conflictType: conflictType,
            conflictAnalysisEngine: 'PythonQGIS + PostGIS',
            // Land records
            surveyor: surveyor,
            recommendedAction: action,
            lastUpdated: verDate.toISOString().split('T')[0],
            observations: generateObservation(score, type),
            khatianNo: `KH-${randomInt(100, 999)}/${randomInt(10, 99)}`,
            dagNo: `DG-${randomInt(100, 999)}`,
            ownerName: ownerName,
            mutationRecords: generateMutationRecords(ownerName),
            landType: randomChoice(['Agricultural', 'Homestead', 'Commercial', 'Fallow', 'Orchard']),
            // Elevation/terrain from LiDAR
            elevation: elevation,
            terrainType: terrainType,
            // Survey mission link
            missionId: missionId,
            // ODM orthomosaic
            orthomosaicResolution: randomFloat(2.5, 5.0, 1) + ' cm/px',
            odmProcessingDate: verDate.toISOString().split('T')[0],
        });
    }

    return parcels;
}

function generateObservation(score, type) {
    if (score > 60) {
        return randomChoice([
            'U-Net boundary extraction shows major shift on eastern edge (~3.2 m). PostGIS IoU below threshold.',
            'Significant encroachment detected. ODM orthomosaic confirms construction beyond RoR boundary.',
            'Spatial boundary mismatch exceeds tolerance. AI confidence reduced due to vegetation obstruction.',
            'Major area discrepancy between ODM survey and RoR records. Possible illegal extension detected.',
            'PostGIS analysis reveals unregistered construction beyond recorded boundary polygon.'
        ]);
    } else if (score > 40) {
        return randomChoice([
            'Minor boundary offset on western edge (~1.5 m). PostGIS spatial comparison within marginal range.',
            'Area difference within acceptable range but U-Net extracted boundary shifted from RoR records.',
            'Partial encroachment near road-side boundary detected in change analysis.',
            'Shape distortion likely due to legacy survey inaccuracy. Re-survey recommended for confirmation.'
        ]);
    } else {
        return randomChoice([
            'Boundaries align within RTK accuracy tolerance. U-Net extraction clean.',
            'No significant discrepancy. PostGIS spatial comparison confirms match.',
            'Within acceptable IoU threshold. Minor GPS variance only.',
            'ODM orthomosaic and RoR boundary polygons match. No conflict detected.'
        ]);
    }
}

// Generate the data
const PARCELS = generateParcels();

// Compute summary statistics
function computeSummary(parcels) {
    const low = parcels.filter(p => p.score <= 20);
    const moderate = parcels.filter(p => p.score > 20 && p.score <= 40);
    const high = parcels.filter(p => p.score > 40 && p.score <= 60);
    const veryHigh = parcels.filter(p => p.score > 60);

    const avgScore = parseFloat((parcels.reduce((s, p) => s + p.score, 0) / parcels.length).toFixed(1));

    return {
        total: parcels.length,
        avgScore: avgScore,
        low: { count: low.length, percent: Math.round(low.length / parcels.length * 100) },
        moderate: { count: moderate.length, percent: Math.round(moderate.length / parcels.length * 100) },
        high: { count: high.length, percent: Math.round(high.length / parcels.length * 100) },
        veryHigh: { count: veryHigh.length, percent: Math.round(veryHigh.length / parcels.length * 100) },
        pendingCount: parcels.filter(p => p.status === 'Pending').length,
        inProgressCount: parcels.filter(p => p.status === 'In Progress').length,
        verifiedCount: parcels.filter(p => p.status === 'Verified').length,
        rejectedCount: parcels.filter(p => p.status === 'Rejected').length,
        avgAiConfidence: parseFloat((parcels.reduce((s, p) => s + p.aiConfidence, 0) / parcels.length).toFixed(1)),
        avgIoU: parseFloat((parcels.reduce((s, p) => s + p.iouScore, 0) / parcels.length).toFixed(3)),
    };
}

const SUMMARY = computeSummary(PARCELS);

// GCP (Ground Control Points) data
const GCP_POINTS = [
    { id: 'GCP-001', lat: 13.3095, lng: 80.1910, elevation: 11.2, accuracy: 0.8, type: 'Permanent', status: 'Active' },
    { id: 'GCP-002', lat: 13.3110, lng: 80.1940, elevation: 12.5, accuracy: 0.6, type: 'Permanent', status: 'Active' },
    { id: 'GCP-003', lat: 13.3128, lng: 80.1970, elevation: 10.8, accuracy: 0.9, type: 'Temporary', status: 'Active' },
    { id: 'GCP-004', lat: 13.3140, lng: 80.1920, elevation: 13.1, accuracy: 0.7, type: 'Permanent', status: 'Active' },
    { id: 'GCP-005', lat: 13.3100, lng: 80.1980, elevation: 9.4, accuracy: 1.1, type: 'Temporary', status: 'Active' },
    { id: 'GCP-006', lat: 13.3150, lng: 80.1960, elevation: 14.2, accuracy: 0.5, type: 'Permanent', status: 'Active' },
    { id: 'GCP-007', lat: 13.3115, lng: 80.1900, elevation: 11.8, accuracy: 0.8, type: 'Temporary', status: 'Inactive' },
    { id: 'GCP-008', lat: 13.3135, lng: 80.1990, elevation: 10.3, accuracy: 1.0, type: 'Permanent', status: 'Active' },
];

// Survey mission data (VTOL drone missions)
const SURVEY_MISSIONS = [
    {
        id: 'MSN-001', date: '2025-05-10', drone: 'VTOL-01 (PX4)',
        pilot: 'Debashis Mondal', status: 'Completed',
        area: '2.4 sq km', altitude: '120 m AGL', overlap: '80/70%',
        flightTime: '42 min', images: 847, gcpsUsed: 6,
        parcelsProcessed: 25, rtkMode: 'RTK Fixed',
        orthomosaicRes: '3.2 cm/px', pointCloud: '12.4M points',
        processingStatus: 'ODM Complete', odmVersion: 'ODM 3.2.1'
    },
    {
        id: 'MSN-002', date: '2025-05-14', drone: 'VTOL-01 (PX4)',
        pilot: 'Amit Sharma', status: 'Completed',
        area: '2.1 sq km', altitude: '120 m AGL', overlap: '80/70%',
        flightTime: '38 min', images: 723, gcpsUsed: 5,
        parcelsProcessed: 25, rtkMode: 'RTK Fixed',
        orthomosaicRes: '3.4 cm/px', pointCloud: '11.2M points',
        processingStatus: 'ODM Complete', odmVersion: 'ODM 3.2.1'
    },
    {
        id: 'MSN-003', date: '2025-05-17', drone: 'VTOL-02 (ArduPilot)',
        pilot: 'Priya Das', status: 'Completed',
        area: '2.8 sq km', altitude: '100 m AGL', overlap: '80/75%',
        flightTime: '51 min', images: 1024, gcpsUsed: 7,
        parcelsProcessed: 25, rtkMode: 'PPK Corrected',
        orthomosaicRes: '2.8 cm/px', pointCloud: '15.1M points',
        processingStatus: 'ODM Complete', odmVersion: 'ODM 3.2.1'
    },
    {
        id: 'MSN-004', date: '2025-05-20', drone: 'VTOL-01 (PX4)',
        pilot: 'Suresh Halder', status: 'Completed',
        area: '2.3 sq km', altitude: '120 m AGL', overlap: '80/70%',
        flightTime: '40 min', images: 812, gcpsUsed: 6,
        parcelsProcessed: 25, rtkMode: 'RTK Fixed',
        orthomosaicRes: '3.1 cm/px', pointCloud: '13.6M points',
        processingStatus: 'ODM Complete', odmVersion: 'ODM 3.2.1'
    },
    {
        id: 'MSN-005', date: '2025-05-23', drone: 'VTOL-02 (ArduPilot)',
        pilot: 'Debashis Mondal', status: 'Completed',
        area: '2.6 sq km', altitude: '100 m AGL', overlap: '85/75%',
        flightTime: '48 min', images: 956, gcpsUsed: 8,
        parcelsProcessed: 25, rtkMode: 'RTK Fixed',
        orthomosaicRes: '2.9 cm/px', pointCloud: '14.8M points',
        processingStatus: 'ODM Complete', odmVersion: 'ODM 3.2.1'
    },
    {
        id: 'MSN-006', date: '2025-05-26', drone: 'VTOL-01 (PX4)',
        pilot: 'Amit Sharma', status: 'Processing',
        area: '2.5 sq km', altitude: '120 m AGL', overlap: '80/70%',
        flightTime: '44 min', images: 891, gcpsUsed: 6,
        parcelsProcessed: 25, rtkMode: 'RTK Fixed',
        orthomosaicRes: '—', pointCloud: '—',
        processingStatus: 'U-Net Extraction In Progress', odmVersion: 'ODM 3.2.1'
    },
];

// User data for the Users page
const USERS = [
    { id: 1, name: 'Admin', fullName: 'Sushil Kumar', email: 'admin@asunama.gov.in', role: 'admin', status: 'online', lastActive: '2025-05-26', parcelsAssigned: '-' },
    { id: 2, name: 'Amit Sharma', fullName: 'Amit Kumar Sharma', email: 'amit.sharma@asunama.gov.in', role: 'surveyor', status: 'online', lastActive: '2025-05-26', parcelsAssigned: 23 },
    { id: 3, name: 'Priya Das', fullName: 'Priya Rani Das', email: 'priya.das@asunama.gov.in', role: 'surveyor', status: 'offline', lastActive: '2025-05-25', parcelsAssigned: 18 },
    { id: 4, name: 'Rajesh Kumar', fullName: 'Rajesh Kumar Singh', email: 'rajesh.k@asunama.gov.in', role: 'verifier', status: 'online', lastActive: '2025-05-26', parcelsAssigned: 31 },
    { id: 5, name: 'Sunita Ghosh', fullName: 'Sunita Ghosh', email: 'sunita.g@asunama.gov.in', role: 'verifier', status: 'offline', lastActive: '2025-05-24', parcelsAssigned: 27 },
    { id: 6, name: 'Debashis Mondal', fullName: 'Debashis Mondal', email: 'debashis.m@asunama.gov.in', role: 'surveyor', status: 'online', lastActive: '2025-05-26', parcelsAssigned: 20 },
    { id: 7, name: 'Ananya Chatterjee', fullName: 'Ananya Chatterjee', email: 'ananya.c@asunama.gov.in', role: 'viewer', status: 'offline', lastActive: '2025-05-23', parcelsAssigned: '-' },
    { id: 8, name: 'Suresh Halder', fullName: 'Suresh Chandra Halder', email: 'suresh.h@asunama.gov.in', role: 'surveyor', status: 'offline', lastActive: '2025-05-22', parcelsAssigned: 15 },
    { id: 9, name: 'Mousumi Roy', fullName: 'Mousumi Roy', email: 'mousumi.r@asunama.gov.in', role: 'verifier', status: 'online', lastActive: '2025-05-26', parcelsAssigned: 16 },
];

// Reports data
const RECENT_REPORTS = [
    { id: 'RPT-2025-042', type: 'PostGIS Spatial Summary', date: '2025-05-25', generatedBy: 'Admin', status: 'Completed', parcels: 150 },
    { id: 'RPT-2025-041', type: 'ODM vs RoR Comparison', date: '2025-05-23', generatedBy: 'Rajesh Kumar', status: 'Completed', parcels: 57 },
    { id: 'RPT-2025-040', type: 'Conflict Analysis Report', date: '2025-05-22', generatedBy: 'Admin', status: 'Completed', parcels: 35 },
    { id: 'RPT-2025-039', type: 'U-Net Extraction Summary', date: '2025-05-20', generatedBy: 'Sunita Ghosh', status: 'Completed', parcels: 150 },
    { id: 'RPT-2025-038', type: 'Encroachment Report', date: '2025-05-18', generatedBy: 'Admin', status: 'Completed', parcels: 22 },
];

// Action log data
const ACTION_LOG = [
    { id: 'ACT-089', action: 'PostGIS Boundary Updated', parcelId: '143', user: 'Rajesh Kumar', date: '2025-05-26 14:32', status: 'Completed' },
    { id: 'ACT-088', action: 'Field Verification Submitted', parcelId: '150', user: 'Amit Sharma', date: '2025-05-26 11:15', status: 'Pending Review' },
    { id: 'ACT-087', action: 'ODM Orthomosaic Generated', parcelId: 'MSN-006', user: 'System', date: '2025-05-26 09:30', status: 'Completed' },
    { id: 'ACT-086', action: 'U-Net Extraction Complete', parcelId: 'MSN-005', user: 'System', date: '2025-05-25 16:45', status: 'Completed' },
    { id: 'ACT-085', action: 'Parcel Approved & Synced', parcelId: '108', user: 'Sunita Ghosh', date: '2025-05-25 10:20', status: 'Completed' },
    { id: 'ACT-084', action: 'RTK Field Inspection', parcelId: '129', user: 'Priya Das', date: '2025-05-24 09:00', status: 'Completed' },
    { id: 'ACT-083', action: 'PostGIS Data Exported', parcelId: '-', user: 'Admin', date: '2025-05-24 08:30', status: 'Completed' },
    { id: 'ACT-082', action: 'Encroachment Flagged (AI)', parcelId: '118', user: 'System', date: '2025-05-23 15:10', status: 'Under Review' },
];
