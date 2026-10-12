// アプリケーション メインエントリーポイント
import './styles/index.css';
import discupMachine from './data/machines/discup_ultraremix.json';
import thundervMachine from './data/machines/thunderv.json';
import genericMachine from './data/machines/generic.json';
import { settings } from './core/settings.js';
import { preloadSymbolImages } from './core/symbols.js';
import { PracticeView } from './ui/PracticeView.js';
import { RealView } from './ui/RealView.js';
import { TargetView } from './ui/TargetView.js';
import { StatsView } from './ui/StatsView.js';
import { SettingsView } from './ui/SettingsView.js';

const MACHINES = {
  discup_ultraremix: discupMachine,
  thunderv: thundervMachine,
  generic: genericMachine
};

class App {
  constructor() {
    this.currentViewInstance = null;
    this.currentTab = 'practice';

    // 図柄画像の非同期プリロード開始
    preloadSymbolImages().catch(err => console.error('Preload failed', err));

    this.init();
  }

  getMachineData() {
    const s = settings.get();
    return MACHINES[s.machineId] || discupMachine;
  }

  init() {
    this.renderShell();
    this.setupNavigation();
    this.switchTab('practice');
  }

  renderShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="app-header">
        <div class="brand-logo" id="brand-logo">
          <span>⚡ BITA TRAINER</span>
        </div>
        <nav class="nav-links">
          <button class="nav-tab active" data-tab="practice">練習モード</button>
          <button class="nav-tab" data-tab="real">本番モード</button>
          <button class="nav-tab" data-tab="target">狙い設定</button>
          <button class="nav-tab" data-tab="stats">統計・順位</button>
          <button class="nav-tab" data-tab="settings">設定</button>
        </nav>
      </header>

      <main class="view-container" id="main-view"></main>
    `;
  }

  setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    document.getElementById('brand-logo').onclick = () => {
      this.switchTab('practice');
    };
  }

  switchTab(tabName) {
    if (this.currentViewInstance?.destroy) {
      this.currentViewInstance.destroy();
    }

    this.currentTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    const container = document.getElementById('main-view');
    container.innerHTML = '';

    const machineData = this.getMachineData();

    switch (tabName) {
      case 'practice':
        this.currentViewInstance = new PracticeView(container, machineData);
        break;
      case 'real':
        this.currentViewInstance = new RealView(container, machineData);
        break;
      case 'target':
        this.currentViewInstance = new TargetView(container, machineData);
        break;
      case 'stats':
        this.currentViewInstance = new StatsView(container);
        break;
      case 'settings':
        this.currentViewInstance = new SettingsView(container, machineData, () => {
          this.switchTab('settings');
        });
        break;
      default:
        this.switchTab('practice');
        break;
    }
  }
}

// アプリ起動
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
