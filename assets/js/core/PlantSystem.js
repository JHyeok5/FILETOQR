/**
 * 가상 식물 시스템 클래스
 * 식물 성장 및 관리 기능을 제공합니다.
 */
export class PlantSystem {
    constructor() {
        // 현재 식물 상태
        this.currentPlant = {
            id: 'sprout',
            name: '새싹',
            level: 0,
            experience: 0,
            maxExperience: 100,
            stage: 0,
            maxStage: 5
        };
        
        // 테마별 식물 정보
        this.plantThemes = {
            indoor: [
                { id: 'pothos', name: '스킨답서스', stages: 5, requiredLevel: 0 },
                { id: 'cactus', name: '선인장', stages: 5, requiredLevel: 3 },
                { id: 'ficus', name: '고무나무', stages: 5, requiredLevel: 5 },
                { id: 'moneyPlant', name: '행운목', stages: 5, requiredLevel: 8 },
                { id: 'orchid', name: '서양란', stages: 5, requiredLevel: 12 }
            ],
            garden: [
                { id: 'tulip', name: '튤립', stages: 5, requiredLevel: 0 },
                { id: 'rose', name: '장미', stages: 5, requiredLevel: 3 },
                { id: 'sunflower', name: '해바라기', stages: 5, requiredLevel: 5 },
                { id: 'lavender', name: '라벤더', stages: 5, requiredLevel: 8 },
                { id: 'daisy', name: '데이지', stages: 5, requiredLevel: 12 }
            ],
            tropical: [
                { id: 'monstera', name: '몬스테라', stages: 5, requiredLevel: 0 },
                { id: 'palmTree', name: '야자수', stages: 5, requiredLevel: 3 },
                { id: 'birdOfParadise', name: '극락조', stages: 5, requiredLevel: 5 },
                { id: 'anthurium', name: '안스리움', stages: 5, requiredLevel: 8 },
                { id: 'hybiscus', name: '히비스커스', stages: 5, requiredLevel: 12 }
            ],
            succulent: [
                { id: 'echeveria', name: '에케베리아', stages: 5, requiredLevel: 0 },
                { id: 'aloe', name: '알로에', stages: 5, requiredLevel: 3 },
                { id: 'haworthia', name: '하월시아', stages: 5, requiredLevel: 5 },
                { id: 'jadePlant', name: '금전수', stages: 5, requiredLevel: 8 },
                { id: 'burrosTail', name: '달꼬리', stages: 5, requiredLevel: 12 }
            ]
        };
        
        // 사용자 컬렉션
        this.collection = {};
        
        // 현재 테마
        this.currentTheme = 'indoor';
    }
    
    /**
     * 식물 시스템 초기화
     */
    initialize() {
        // 로컬 스토리지에서 저장된 데이터 로드
        this._loadData();
        
        // UI 업데이트
        this._updatePlantDisplay();
        this._updatePlantInfo();
        this._updateCollection();
    }
    
    /**
     * 식물 테마 설정
     * @param {string} theme - 테마 (indoor, garden, tropical, succulent)
     */
    setTheme(theme) {
        if (!this.plantThemes[theme]) return;
        
        this.currentTheme = theme;
        
        // 테마 변경 시 UI 업데이트
        this._updateCollection();
        this._saveData();
    }
    
    /**
     * 경험치 추가
     * @param {number} exp - 추가할 경험치
     */
    addExperience(exp) {
        if (exp <= 0) return;
        
        this.currentPlant.experience += exp;
        
        // 레벨업 체크
        while (this.currentPlant.experience >= this.currentPlant.maxExperience) {
            this.currentPlant.experience -= this.currentPlant.maxExperience;
            this.currentPlant.level++;
            
            // 새 식물 잠금 해제 확인
            this._checkUnlocks();
            
            // 최대 경험치 증가 (레벨에 따라)
            this.currentPlant.maxExperience = 100 + (this.currentPlant.level * 20);
        }
        
        // 성장 단계 계산
        this._calculateStage();
        
        // UI 업데이트
        this._updatePlantDisplay();
        this._updatePlantInfo();
        this._updateCollection();
        
        // 데이터 저장
        this._saveData();
    }
    
    /**
     * 식물 변경
     * @param {string} plantId - 식물 ID
     */
    changePlant(plantId) {
        // 컬렉션에 있는 식물인지 확인
        if (!this.collection[plantId]) return;
        
        const themeKey = this._findPlantTheme(plantId);
        if (!themeKey) return;
        
        const plantInfo = this.plantThemes[themeKey].find(p => p.id === plantId);
        if (!plantInfo) return;
        
        // 현재 식물 업데이트
        this.currentPlant.id = plantId;
        this.currentPlant.name = plantInfo.name;
        this.currentPlant.maxStage = plantInfo.stages;
        
        // 성장 단계 재계산
        this._calculateStage();
        
        // UI 업데이트
        this._updatePlantDisplay();
        this._updatePlantInfo();
        
        // 데이터 저장
        this._saveData();
    }
    
    /**
     * 성장 단계 계산
     * @private
     */
    _calculateStage() {
        // 레벨에 따른 성장 단계 계산 (0부터 maxStage까지)
        const levelPerStage = 3; // 3레벨마다 성장
        const calculatedStage = Math.min(
            Math.floor(this.currentPlant.level / levelPerStage),
            this.currentPlant.maxStage
        );
        
        this.currentPlant.stage = calculatedStage;
    }
    
    /**
     * 새 식물 잠금 해제 확인
     * @private
     */
    _checkUnlocks() {
        Object.keys(this.plantThemes).forEach(theme => {
            this.plantThemes[theme].forEach(plant => {
                if (this.currentPlant.level >= plant.requiredLevel) {
                    // 컬렉션에 추가
                    this.collection[plant.id] = {
                        id: plant.id,
                        name: plant.name,
                        theme: theme,
                        unlocked: true
                    };
                }
            });
        });
    }
    
    /**
     * 식물이 속한 테마 찾기
     * @param {string} plantId - 식물 ID
     * @returns {string|null} - 테마 키
     * @private
     */
    _findPlantTheme(plantId) {
        for (const theme in this.plantThemes) {
            const found = this.plantThemes[theme].find(p => p.id === plantId);
            if (found) return theme;
        }
        return null;
    }
    
    /**
     * 식물 표시 업데이트
     * @private
     */
    _updatePlantDisplay() {
        const plantImage = document.getElementById('plant-image');
        
        // 모든 성장 단계 클래스 제거
        for (let i = 0; i <= this.currentPlant.maxStage; i++) {
            plantImage.querySelector('.plant-growth').classList.remove(`plant-stage-${i}`);
        }
        
        // 현재 성장 단계 클래스 추가
        plantImage.querySelector('.plant-growth').classList.add(`plant-stage-${this.currentPlant.stage}`);
    }
    
    /**
     * 식물 정보 업데이트
     * @private
     */
    _updatePlantInfo() {
        const plantName = document.getElementById('plant-name');
        const plantLevel = document.getElementById('plant-level');
        const plantExp = document.getElementById('plant-exp');
        const plantExpProgress = document.getElementById('plant-exp-progress');
        
        plantName.textContent = this.currentPlant.name;
        plantLevel.textContent = `레벨: ${this.currentPlant.level}`;
        plantExp.textContent = `경험치: ${this.currentPlant.experience} / ${this.currentPlant.maxExperience}`;
        
        // 경험치 바 업데이트
        const expPercentage = (this.currentPlant.experience / this.currentPlant.maxExperience) * 100;
        plantExpProgress.style.width = `${expPercentage}%`;
    }
    
    /**
     * 컬렉션 업데이트
     * @private
     */
    _updateCollection() {
        const collectionGrid = document.getElementById('plant-collection-grid');
        collectionGrid.innerHTML = '';
        
        // 현재 테마의 식물만 표시
        this.plantThemes[this.currentTheme].forEach(plant => {
            const isUnlocked = this.collection[plant.id]?.unlocked || false;
            
            const plantItem = document.createElement('div');
            plantItem.className = `plant-item ${isUnlocked ? '' : 'locked'}`;
            
            // 잠금 해제된 식물만 클릭 가능
            if (isUnlocked) {
                plantItem.addEventListener('click', () => this.changePlant(plant.id));
            }
            
            // 현재 선택된 식물 표시
            if (this.currentPlant.id === plant.id) {
                plantItem.classList.add('selected');
            }
            
            plantItem.innerHTML = `
                <div class="plant-item-image">
                    ${isUnlocked 
                        ? `<div class="plant-icon ${plant.id}"></div>` 
                        : '<div class="plant-icon locked"><i class="fas fa-lock"></i></div>'
                    }
                </div>
                <p>${isUnlocked ? plant.name : '???'}</p>
                ${!isUnlocked ? `<small>레벨 ${plant.requiredLevel} 필요</small>` : ''}
            `;
            
            collectionGrid.appendChild(plantItem);
        });
    }
    
    /**
     * 데이터 저장
     * @private
     */
    _saveData() {
        const data = {
            currentPlant: this.currentPlant,
            collection: this.collection,
            currentTheme: this.currentTheme
        };
        
        localStorage.setItem('plantSystem', JSON.stringify(data));
    }
    
    /**
     * 데이터 로드
     * @private
     */
    _loadData() {
        const savedData = localStorage.getItem('plantSystem');
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            this.currentPlant = data.currentPlant;
            this.collection = data.collection;
            this.currentTheme = data.currentTheme || 'indoor';
        } else {
            // 초기 식물 잠금 해제
            const initialPlant = this.plantThemes[this.currentTheme][0];
            this.collection[initialPlant.id] = {
                id: initialPlant.id,
                name: initialPlant.name,
                theme: this.currentTheme,
                unlocked: true
            };
            
            this.currentPlant.id = initialPlant.id;
            this.currentPlant.name = initialPlant.name;
        }
    }
} 