# 눈싸움 동네 평정기 - 사운드 패키지 v1.0

## 구성
- BGM: 지역별 루프 음악 6곡. 외부 곡을 모방하지 않은 간단한 오리지널 신시사이저 멜로디.
- SFX: 행동/아이템/UI 효과음 27종.
- AMBIENCE: 겨울 환경 반복음 5종.
- VOICE_CUES: 말 없는 캐릭터 반응 전자음 8종.
- DOCS: 설명서, ID/용도 CSV+JSON, 한국어 대사 스크립트.
- EXAMPLES: 브라우저 게임 연결 예제.

**중요:** 이 팩은 실행 가능한 테스트용 합성 사운드 초안입니다. `VOICE_CUES`는 한국어 대사를 말하는 음성이 아니라 짧은 전자음입니다. 실제 한국어 대사 음성은 `DOCS/CHARACTER_LINES.csv`의 대본을 토대로 별도 녹음/TTS 작업이 필요합니다.

## 기술 규격
- 22,050 Hz / mono / WAV PCM 16-bit.
- 게임엔진에서 재생 가능; 배포판에서는 OGG/MP3/AAC로 변환하면 용량 감소.
- BGM은 짧은 음악 루프 (약 14~21초). 프로토타입 테스트 중심이며 추후 60~120초 마스터로 확장 권장.

## 기본 볼륨 제안 (상대 비율)
- Master 100%; BGM 30%; AMBIENCE 20%; SFX 70%; VOICE_CUES 52%.
- 걸음/반복 SFX는 35~52% 정도로 낮춰 겹침 피로를 방지.
- 음원이 겹치면 동시 발음 8~12개로 제한하고 동일 SFX는 60~100ms 간격 둡니다.
- 화면 밖 소리는 감쇠 처리하고 중요한 명중/경고음이 BGM보다 먼저 들리게 합니다.

## 게임 이벤트 연결 예시
| 게임 이벤트 | 사운드 ID | 처리 |
|---|---|---|
| 캐릭터 이동 | snow_step_01/02 | 발을 디딜 때 교차 |
| 눈 뭉치기 시작 | snow_gather | 1회 |
| 던지기 시작 | snow_throw | 1회 |
| 명중 판정 | snow_hit | 1회 |
| 눈벽 건설/파괴 | snow_wall_build / snow_wall_break | 1회 |
| 회피 | snow_slide | 1회 |
| 손 시림 경고 | cold_hands | 재생 간격 2초 이상 |
| 눈덩이 보충 | snow_reload | 완료 시 1회 |
| 아이템 획득 | item_pickup | 1회 |
| 핫팩/핫초코 | item_hotpack / item_hotcocoa | 사용 시 1회 |
| 종료 10초 | clock_warning | 1회 |
| 귀가 이벤트 | home_call | 벨 신호 후 대사 음성 재생 예정 |
| 승패 | round_win / round_lose | BGM 페이드아웃 후 |

## 지역 BGM 매칭
다산동 → bgm_dasan_afterschool
별내동 → bgm_byeollae_bunny
호평·평내 골목 → bgm_hopyeong_chase
진접읍 → bgm_jinjeop_fort
덕소 강변 → bgm_deokso_river
화도읍 보스전 → bgm_hwado_boss

## 브라우저 게임 사용법
1. ZIP을 풀어 `BGM`, `SFX`, `VOICE_CUES`, `AMBIENCE` 폴더를 웹 프로젝트 `public/audio/`에 복사합니다.
2. `DOCS/sound_manifest.json`을 읽고 ID로 파일을 참조합니다.
3. `EXAMPLES/web_audio_example.js` 참고. 최초 재생은 사용자 입력(시작 버튼 클릭/터치) 후 허용됩니다.
4. 새 화면에서는 BGM을 크로스페이드하거나 전환하고, 게임 종료 시 관련 루프를 정지합니다.

## 모바일 권장
- BGM+환경음 2채널 수준, SFX는 동시 8개 내외 유지.
- 모바일에서 웹 오디오 최초 재생은 탭 입력 필요.
- 폰 스피커에서 지나친 저음과 큰 음량을 피해 실제 기기로 확인.
- UI 접근성: BGM, SFX, 음성 음량 분리 및 전체 음소거 토글.

## 라이선스/범위
합성 파형을 직접 생성한 테스트용 사운드이며 제3자 상용 음원이나 기존 게임 음악을 가져오지 않았습니다. 게임 프로젝트에서 사용·편집 가능합니다. 품질과 볼륨은 최종 배포 전 실제 기기 테스트를 권합니다.
