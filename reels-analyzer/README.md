# 인스타 릴스 대본 분석기

홈페이지와는 별개인 연습용 도구입니다. (홈페이지 빌드에는 영향 없음)

## 순서
1. **토큰 준비**: Apify 콘솔 → Settings → API & Integrations 에서 API 토큰 복사
2. **토큰 넣기**: 이 폴더의 `.env.example` 을 복사해 `.env` 로 이름을 바꾸고 `APIFY_TOKEN=내토큰` 적기
3. **릴스 가져오기** (프롬프트 1):
   ```bash
   node reels-analyzer/fetch-reels.mjs 인스타아이디 20
   ```
   → `reels-analyzer/output/아이디-날짜.json` 에 저장됩니다.
   대본(말한 내용)까지 가져오려면 끝에 `--transcript` 를 붙입니다. (릴스 1개당 약 $0.048 추가)
   ```bash
   node reels-analyzer/fetch-reels.mjs 인스타아이디 10 --transcript
   ```
4. **대본 뽑기** (위스퍼): 조회수 상위 10개 영상을 OpenAI 위스퍼(whisper-1, 단어별 시각)로 받아 적고, 0~3초를 '훅'으로 따로 저장합니다. `.env` 에 `OPENAI_API_KEY` 필요.
   ```bash
   node reels-analyzer/transcribe.mjs reels-analyzer/output/아이디-날짜.json 10
   ```
   → `아이디-날짜-transcripts.json` 에 저장 (위스퍼 요금: 1분에 약 $0.006)
   인스타 영상 서버에 접속이 안 되는 곳(클라우드 등)에서는 3단계에서 `--video` 를 붙여 Apify에 영상 사본을 남겨 두면 그걸 대신 씁니다. (1개당 $0.02)
5. **분석** (프롬프트 2): `ANALYSIS-PROMPT.md` 내용을 Claude Code에 붙여 넣고 위 파일을 알려 줍니다.

## 참고
- 필요한 것: Node.js 18 이상 (설치할 패키지 없음)
- 개수를 크게 하면 Apify 크레딧이 더 듭니다. 처음엔 10~20개로 시험하세요.
- 공개 계정만 가져올 수 있습니다.
- 가져온 자료에는 조회수·좋아요·댓글 수·캡션·날짜·영상 길이 등이 들어 있습니다. 말한 내용(대본)이 들어 있지 않다면 "영상을 봐야 아는 항목"은 분석 결과에 [눈으로 확인]으로 따로 표시됩니다.
- **클라우드(claude.ai/code)에서 실행할 때**: 토큰은 작업 공간 설정에 저장되어 자동으로 붙습니다. `.env` 없이 아래처럼 실행합니다.
  ```bash
  APIFY_TOKEN=proxy-injected node reels-analyzer/fetch-reels.mjs 인스타아이디 10
  ```
