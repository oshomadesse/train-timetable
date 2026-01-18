let selectedStation = 'juso';
let timetableData = null;

// 平日/土日祝の判定
function getTimetableType() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
}

// JSONファイルの読み込み
async function loadTimetable() {
    try {
        const type = getTimetableType(); // 'weekday' or 'weekend'
        const lines = ['kyoto', 'kobe', 'takarazuka'];

        // juso_to_umeda のデータを読み込み（3路線分を並列で取得）
        const jusoToUmedaPromises = lines.map(line =>
            fetch(`./data/juso_to_umeda/${line}_${type}.json`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${line}_${type}.json`);
                    return res.json();
                })
                .then(data => data.juso_to_umeda)
        );

        const jusoToUmedaArrays = await Promise.all(jusoToUmedaPromises);
        const jusoToUmeda = jusoToUmedaArrays
            .flat()
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        // umeda_to_juso のデータ（将来的に追加予定、現在は空配列）
        const umedaToJuso = [];

        timetableData = {
            juso_to_umeda: jusoToUmeda,
            umeda_to_juso: umedaToJuso
        };

        console.log(`時刻表データを読み込みました: ${type} (${jusoToUmeda.length}本)`);
    } catch (error) {
        console.error('時刻表データの読み込みに失敗しました:', error);
        alert('時刻表データの読み込みに失敗しました。');
    }
}

// 路線情報
const lineInfo = {
    kyoto: { name: "京都線", class: "kyoto" },
    takarazuka: { name: "宝塚線", class: "takarazuka" },
    kobe: { name: "神戸線", class: "kobe" }
};

// 現在時刻の表示
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}

// 駅選択
function selectStation(station) {
    selectedStation = station;

    document.getElementById('umeda-btn').classList.remove('selected');
    document.getElementById('juso-btn').classList.remove('selected');
    document.getElementById(`${station}-btn`).classList.add('selected');

    document.getElementById('check-btn').disabled = false;
    document.getElementById('results').classList.remove('show');
}

// 時刻をミリ秒に変換
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 電車検索
function checkTrains() {
    if (!timetableData) {
        alert('時刻表データが読み込まれていません。');
        return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const timetable = selectedStation === 'umeda'
        ? timetableData.umeda_to_juso
        : timetableData.juso_to_umeda;

    const upcomingTrains = timetable.filter(train => {
        return timeToMinutes(train.time) >= currentMinutes;
    });

    const nextThreeTrains = upcomingTrains.slice(0, 3);
    displayResults(nextThreeTrains);
}

// 結果表示
function displayResults(trains) {
    const resultsDiv = document.getElementById('results');

    if (trains.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">本日の運行は終了しました</div>';
        resultsDiv.classList.add('show');
        return;
    }

    let html = '';
    trains.forEach(train => {
        const info = lineInfo[train.line];
        html += `
            <div class="train-card ${info.class}">
                <div class="train-time">${train.time} 発 | ${train.platform}番線</div>
                <div class="train-line">
                    <span class="line-badge ${info.class}">${info.name}</span>
                    ${train.type} ${train.destination}行き
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
    resultsDiv.classList.add('show');
}

// 初期化
async function init() {
    await loadTimetable();
    setInterval(updateTime, 1000);
    updateTime();
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', init);
