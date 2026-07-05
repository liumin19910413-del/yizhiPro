import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarBlank,
  Camera,
  CaretRight,
  CheckCircle,
  ClipboardText,
  Flower,
  Key,
  Microphone,
  NotePencil,
  RocketLaunch,
  SpeakerHigh,
  UserCircle,
  XCircle,
} from "@phosphor-icons/react";
import { defaultTextbookPackage, textbookPackages } from "./content/textbookPackages";

const today = "06月27日";

function pickOptions(answer, pool, count = 3) {
  return Array.from(new Set([answer, ...pool.filter((item) => item && item !== answer)])).slice(0, count);
}

function buildPlan(sourceLessons, startIndex = 0, endIndex = 1, perDay = 1, mode = "daily") {
  const safeStart = Math.max(0, Math.min(startIndex, sourceLessons.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(endIndex, sourceLessons.length - 1));
  const selected = sourceLessons.slice(safeStart, safeEnd + 1);
  const days = [];
  for (let i = 0; i < selected.length; i += perDay) {
    days.push({
      id: `day_${days.length + 1}`,
      label: days.length === 0 ? "今天" : days.length === 1 ? "明天" : `第${days.length + 1}天`,
      date: days.length === 0 ? today : `06月${27 + days.length}日`,
      lessons: selected.slice(i, i + perDay),
    });
  }
  return { mode, startIndex: safeStart, endIndex: safeEnd, perDay, days };
}

function assertTrustedQuestion(question, lesson) {
  const recognition = lesson.recognitionChars || [];
  const chars = recognition.map((item) => item.char);
  const pinyins = recognition.map((item) => item.pinyin);
  const optionSet = new Set(question.options);
  const answerIsVisible = optionSet.has(question.answer);
  const optionsUnique = optionSet.size === question.options.length;
  const enoughOptions = question.options.length >= 2;
  const sourceOk = question.type === "pinyinToChar"
    ? chars.includes(question.answer) && question.options.every((option) => chars.includes(option))
    : question.type === "charToPinyin"
      ? pinyins.includes(question.answer) && question.options.every((option) => pinyins.includes(option))
      : true;

  if (!answerIsVisible || !optionsUnique || !enoughOptions || !sourceOk) {
    throw new Error(`题目校验失败：${lesson.shortTitle} / ${question.type}`);
  }
  return question;
}

function buildChineseQuestions(lesson) {
  const recognition = lesson.recognitionChars || [];
  const words = lesson.words?.length ? lesson.words : lesson.writingChars?.length ? lesson.writingChars : [lesson.title];
  const writingChars = lesson.writingChars?.length ? lesson.writingChars : words;
  const questions = [];

  if (recognition.length) {
    const first = recognition[0];
    const second = recognition[1] || first;
    questions.push({
      type: "charToPinyin",
      prompt: "这个字读什么？",
      display: first.char,
      options: pickOptions(first.pinyin, recognition.map((item) => item.pinyin)),
      answer: first.pinyin,
    });
    questions.push({
      type: "pinyinToChar",
      prompt: "这个拼音对应哪个字？",
      display: second.pinyin,
      options: pickOptions(second.char, recognition.map((item) => item.char)),
      answer: second.char,
    });
  }

  questions.push({
    type: "wordChoice",
    prompt: `“${writingChars[0]}”可以组成哪个词？`,
    display: writingChars[0],
    options: pickOptions(words[0], [words[1], words[2], "冰山", "铅笔刀"].filter(Boolean)),
    answer: words[0],
  });
  questions.push({
    type: "textbookWord",
    prompt: `哪个词语来自《${lesson.title}》？`,
    display: lesson.title,
    options: pickOptions(words.at(-1), [words[0], "动画片", "雪人"].filter(Boolean)),
    answer: words.at(-1),
  });
  questions.push({
    type: "lessonContent",
    prompt: "今天复习的是哪一课？",
    display: lesson.title,
    options: pickOptions(lesson.shortTitle, [lesson.unit, "课外阅读", "口算练习"].filter(Boolean)),
    answer: lesson.shortTitle,
  });
  return questions;
}

function buildLessonSteps(lesson, activePackage) {
  if (activePackage.subject !== "语文") {
    return [
      {
        id: "math_say",
        title: "说一说",
        kind: "recording",
        icon: BookOpen,
        summary: "说清今天复习的知识点",
        text: `请说一说：${lesson.shortTitle} 今天你记住了什么？`,
        reviewType: "数学口述",
      },
      {
        id: "math_photo",
        title: "练一练",
        kind: "photo",
        icon: Camera,
        summary: "完成纸笔练习后拍照",
        photoType: "数学练习",
        targets: [`完成《${lesson.title}》对应的纸笔练习`],
      },
    ];
  }

  const recognition = lesson.recognitionChars || [];
  const first = recognition[0];
  const second = recognition[1] || recognition[0];
  const hasTrustedPinyin = recognition.length >= 2 && recognition.every((item) => item.char && item.pinyin);
  if (!hasTrustedPinyin) {
    return [
      {
        id: "reading",
        title: "阅读课文",
        kind: "recording",
        icon: Microphone,
        summary: "本课拼音数据待接入，先做课文朗读",
        text: lesson.readingText || `请朗读《${lesson.title}》中老师布置的一个自然段。`,
        reviewType: "课文朗读",
      },
    ];
  }

  return [
    {
      id: "pinyin_to_char",
      title: "拼音选汉字",
      kind: "quiz",
      icon: NotePencil,
      summary: "听拼音，选汉字",
      questions: [{
        type: "pinyinToChar",
        prompt: "这个拼音对应哪个字？",
        display: second.pinyin,
        options: pickOptions(second.char, recognition.map((item) => item.char)),
        answer: second.char,
        source: "recognitionChars",
      }].map((question) => assertTrustedQuestion(question, lesson)),
    },
    {
      id: "char_to_pinyin",
      title: "汉字选拼音",
      kind: "quiz",
      icon: NotePencil,
      summary: "看汉字，选拼音",
      questions: [{
        type: "charToPinyin",
        prompt: "这个字读什么？",
        display: first.char,
        options: pickOptions(first.pinyin, recognition.map((item) => item.pinyin)),
        answer: first.pinyin,
        source: "recognitionChars",
      }].map((question) => assertTrustedQuestion(question, lesson)),
    },
    {
      id: "reading",
      title: "阅读课文",
      kind: "recording",
      icon: Microphone,
      summary: "课文片段录音",
      text: lesson.readingText || `请朗读《${lesson.title}》中老师布置的一个自然段。`,
      reviewType: "课文朗读",
    },
  ];
}

function PageHeader({ title, onBack, right }) {
  return (
    <header className="subpage-header">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft weight="bold" />
        返回
      </button>
      <h1>{title}</h1>
      <div className="subpage-right">{right}</div>
    </header>
  );
}

function HomeView({ activePackage, plan, rewards, completion, redoCount, onStart, onParent, onRewards, onRedo }) {
  const dayPlan = plan.days[0];
  const taskGroups = activePackage.subject === "语文"
    ? [
        { title: "拼音选汉字", items: dayPlan.lessons.map((lesson) => lesson.recognitionChars?.[1]?.pinyin || lesson.recognitionChars?.[0]?.pinyin || "拼音待接入") },
        { title: "汉字选拼音", items: dayPlan.lessons.map((lesson) => lesson.recognitionChars?.[0]?.char || lesson.writingChars?.[0] || lesson.title) },
        { title: "阅读课文", items: dayPlan.lessons.map((lesson) => lesson.readingText || `朗读《${lesson.title}》一个自然段`).slice(0, 2) },
      ]
    : [
        { title: "单元练习", items: dayPlan.lessons.map((lesson) => lesson.title) },
        { title: "说清思路", items: ["完成纸笔练习后拍照", "说一说今天记住的知识点"] },
      ];
  return (
    <>
      <header className="listen-hero">
        <button className="plain-back" type="button" aria-label="返回">
          <ArrowLeft weight="bold" />
        </button>
        <div>
          <h1>每日听读</h1>
          <button className="grade-select" type="button" onClick={onParent}>
            {activePackage.grade} <CaretRight weight="bold" />
          </button>
        </div>
      </header>

      <div className="listen-stats">
        <div>
          <span>累计练习</span>
          <strong>{rewards.streakDays + 58}<em>天</em></strong>
        </div>
        <div>
          <span>本月打卡</span>
          <strong className="orange">{completion.done === completion.total ? rewards.streakDays : 0}<em>天</em></strong>
        </div>
      </div>

      <section className="listen-card">
        <div className="date-pill">{today}</div>
        {taskGroups.map((group) => (
          <div className="listen-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.items.length ? group.items.map((item) => <p key={item}>{item}</p>) : <p>暂无内容</p>}
          </div>
        ))}
        <div className="today-check">
          <span><Flower weight="fill" /> 今日可打卡</span>
          <button type="button" onClick={onStart}>开始挑战</button>
        </div>
      </section>

      <section className="listen-card past">
        <div className="date-pill">6月26日</div>
        <div className="listen-group">
          <h3>复习记录</h3>
          <p>{dayPlan.lessons.map((lesson) => lesson.title).join("、")}</p>
        </div>
      </section>

      <div className="listen-footer-actions">
        <button type="button" onClick={onRedo}>再练本 {redoCount ? `(${redoCount})` : ""}</button>
        <button type="button" onClick={onRewards}>🌸 {rewards.flowers}</button>
        <button type="button" onClick={onParent}>家长</button>
      </div>
    </>
  );
}

function QuizStep({ step, quizIndex, answerState, onPick, onNext }) {
  const question = step.questions[quizIndex];
  return (
    <section className="learning-card final-task-card">
      <p>{step.title} · {quizIndex + 1}/{step.questions.length}</p>
      <h3>{question.prompt}</h3>
      <strong className="question-display">{question.display}</strong>
      <div className="answer-grid">
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            className={answerState?.picked === option ? (answerState.correct ? "right" : "wrong") : ""}
            disabled={Boolean(answerState)}
            onClick={() => onPick(question, option)}
          >
            {option}
          </button>
        ))}
      </div>
      {answerState ? (
        <div className={`feedback ${answerState.correct ? "good" : "soft"}`}>
          {answerState.correct ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}
          {answerState.correct ? "答对啦，+1 小红花" : `答错啦，正确答案是：${question.answer}`}
        </div>
      ) : null}
      {answerState ? (
        <button className="modal-primary" type="button" onClick={onNext}>
          {answerState.correct ? "下一题" : "我知道了"}
        </button>
      ) : null}
    </section>
  );
}

function RecordingStep({ lesson, step, recording, onStart, onStop, onSubmit }) {
  return (
    <section className="learning-card reading-card">
      <p>{lesson.shortTitle}</p>
      <h3>{step.text}</h3>
      <div className="reading-tip">
        <SpeakerHigh weight="fill" />
        <span>必须录音提交，学习报告里可以播放确认有没有认真读。</span>
      </div>
      <div className={`recording-panel ${recording.isRecording ? "active" : ""}`}>
        <div className="recording-status">
          <Microphone weight="fill" />
          <span>{recording.isRecording ? `正在录音 ${recording.seconds}s` : recording.url ? "录音已完成，可以试听" : "点击开始录音，读完后停止"}</span>
        </div>
        <div className="recording-actions">
          {!recording.isRecording ? (
            <button className="record-button" type="button" onClick={onStart}>
              <Microphone weight="fill" />
              {recording.url ? "重新录音" : "开始录音"}
            </button>
          ) : (
            <button className="record-button stop" type="button" onClick={onStop}>
              <SpeakerHigh weight="fill" />
              停止录音
            </button>
          )}
          <button className="record-submit" type="button" disabled={!recording.url || recording.isRecording} onClick={onSubmit}>
            提交录音
          </button>
        </div>
        {recording.url ? <audio className="audio-player" controls src={recording.url} /> : null}
        {recording.error ? <div className="feedback soft">{recording.error}</div> : null}
      </div>
    </section>
  );
}

function PhotoStep({ lesson, step, submission, onFile, onSubmit }) {
  return (
    <section className="learning-card photo-task-card">
      <p>{lesson.shortTitle}</p>
      <h3>{step.photoType}：写到本子上，写完拍照</h3>
      <div className="write-targets">
        {step.targets.map((item) => <span key={item}>{item}</span>)}
      </div>
      <label className="photo-upload-button">
        <Camera weight="fill" />
        {submission?.imageUrl ? "重新拍照" : "拍照提交"}
        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
      </label>
      {submission?.imageUrl ? (
        <div className="photo-preview">
          <img src={submission.imageUrl} alt={`${step.photoType}提交照片`} />
          <p>已提交，系统会自动检查并写入学习报告</p>
        </div>
      ) : null}
      <button className="modal-primary" type="button" disabled={!submission?.imageUrl} onClick={onSubmit}>
        提交并检查
      </button>
    </section>
  );
}

function DictationStep({ lesson, step, submission, onFile, onSubmit }) {
  function speak(item) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="learning-card photo-task-card dictation-card">
      <p>{lesson.shortTitle}</p>
      <h3>默一默：听语音，写到本子上</h3>
      <div className="reading-tip">
        <SpeakerHigh weight="fill" />
        <span>孩子端不显示答案，只能点“默写一、默写二”听系统读，写完后拍照提交。</span>
      </div>
      <div className="dictation-list">
        {step.targets.map((item, index) => (
          <button type="button" key={`${item}_${index}`} onClick={() => speak(item)}>
            <span>默写{index + 1}</span>
            <SpeakerHigh weight="fill" />
            播放
          </button>
        ))}
      </div>
      <label className="photo-upload-button">
        <Camera weight="fill" />
        {submission?.imageUrl ? "重新拍照" : "拍照提交"}
        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
      </label>
      {submission?.imageUrl ? (
        <div className="photo-preview">
          <img src={submission.imageUrl} alt="默写提交照片" />
          <p>已提交，系统会按隐藏默写清单自动生成结果</p>
        </div>
      ) : null}
      <button className="modal-primary" type="button" disabled={!submission?.imageUrl} onClick={onSubmit}>
        提交并检查
      </button>
    </section>
  );
}

function StudyShell({ title, stepIndex, totalSteps, onBack, children }) {
  return (
    <section className="minimal-study">
      <header className="study-top">
        <button type="button" onClick={onBack} aria-label="返回"><ArrowLeft weight="bold" /></button>
        <h1>{title}</h1>
        <span>{stepIndex + 1}/{totalSteps}</span>
      </header>
      <div className="study-progress"><span style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} /></div>
      {children}
    </section>
  );
}

function MinimalRecordingStep({ lesson, step, recording, onStart, onStop, onSubmit }) {
  return (
    <section className="minimal-practice">
      <div className="mascot-word">{step.title === "读一读" ? "读" : "文"}</div>
      <h2>{step.title}</h2>
      <p>{step.text.replace("请大声读：", "")}</p>
      {recording.url ? <audio className="audio-player" controls src={recording.url} /> : null}
      {recording.error ? <div className="feedback soft">{recording.error}</div> : null}
      <div className="practice-controls">
        <button type="button" onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(step.text.replace("请大声读：", "")))}><SpeakerHigh weight="fill" /></button>
        {!recording.isRecording ? (
          <button className="main" type="button" onClick={onStart}><Microphone weight="fill" /></button>
        ) : (
          <button className="main active" type="button" onClick={onStop}><Microphone weight="fill" /></button>
        )}
        <button type="button" disabled={!recording.url || recording.isRecording} onClick={onSubmit}><CaretRight weight="fill" /></button>
      </div>
      <small>{recording.isRecording ? `正在录音 ${recording.seconds}s` : recording.url ? "录好了，点右侧继续" : "先听一遍，再按住中间读"}</small>
    </section>
  );
}

function MinimalQuizStep({ step, quizIndex, answerState, onPick, onNext }) {
  const question = step.questions[quizIndex];
  return (
    <section className="minimal-practice">
      <div className="mascot-word">{question.display}</div>
      <h2>{question.prompt}</h2>
      <div className="minimal-options">
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            className={answerState?.picked === option ? (answerState.correct ? "right" : "wrong") : ""}
            disabled={Boolean(answerState)}
            onClick={() => onPick(question, option)}
          >
            {option}
          </button>
        ))}
      </div>
      {answerState ? <p className="minimal-feedback">{answerState.correct ? "答对啦" : `正确答案：${question.answer}`}</p> : null}
      {answerState ? <button className="orange-next" type="button" onClick={onNext}>{answerState.correct ? "下一题" : "我知道了"}</button> : null}
    </section>
  );
}

function MinimalPhotoStep({ lesson, step, submission, onFile, onSubmit }) {
  return (
    <section className="minimal-practice">
      <div className="mascot-word">{step.kind === "dictation" ? "默" : "写"}</div>
      <h2>{step.title}</h2>
      {step.kind === "dictation" ? (
        <div className="minimal-dictation">
          {step.targets.map((item, index) => (
            <button type="button" key={`${item}_${index}`} onClick={() => {
              if (!window.speechSynthesis) return;
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(item);
              utterance.lang = "zh-CN";
              utterance.rate = 0.82;
              window.speechSynthesis.speak(utterance);
            }}>
              默写{index + 1}
            </button>
          ))}
        </div>
      ) : (
        <div className="minimal-write-targets">
          {step.targets.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}
      {submission?.imageUrl ? <img className="minimal-photo" src={submission.imageUrl} alt="提交照片" /> : null}
      <div className="practice-controls">
        <button type="button"><SpeakerHigh weight="fill" /></button>
        <label className="main file-main">
          <Camera weight="fill" />
          <input type="file" accept="image/*" capture="environment" onChange={onFile} />
        </label>
        <button type="button" disabled={!submission?.imageUrl} onClick={onSubmit}><CaretRight weight="fill" /></button>
      </div>
      <small>{step.kind === "dictation" ? "只听编号，不显示答案" : "写到本子上后拍照"}</small>
    </section>
  );
}

function LessonView(props) {
  const { lesson, step, stepIndex, totalSteps, quizIndex, answerState, submission, recording } = props;
  return (
    <StudyShell title="每日听读" stepIndex={stepIndex} totalSteps={totalSteps} onBack={props.onBack}>
      {step.kind === "quiz" ? <MinimalQuizStep step={step} quizIndex={quizIndex} answerState={answerState} onPick={props.onPick} onNext={props.onQuizNext} /> : null}
      {step.kind === "recording" ? <MinimalRecordingStep lesson={lesson} step={step} recording={recording} onStart={props.onStartRecording} onStop={props.onStopRecording} onSubmit={props.onSubmitRecording} /> : null}
      {step.kind === "photo" || step.kind === "dictation" ? <MinimalPhotoStep lesson={lesson} step={step} submission={submission} onFile={props.onPhotoFile} onSubmit={props.onPhotoSubmit} /> : null}
    </StudyShell>
  );
}

function RewardCenter({ rewards, rewardItems, exchangeRecords, onExchange, onBack }) {
  return (
    <section className="subpage-view">
      <PageHeader title="奖励中心" onBack={onBack} />
      <section className="reward-balance-card">
        <Flower weight="fill" />
        <span>当前小红花</span>
        <strong>{rewards.flowers} 朵</strong>
      </section>
      <section className="report-card">
        <h3>可以兑换</h3>
        <div className="reward-list">
          {rewardItems.filter((item) => item.enabled).map((item) => {
            const enough = rewards.flowers >= item.cost;
            return (
              <article className="reward-item" key={item.id}>
                <div>
                  <strong>{item.cost}朵</strong>
                  <p>{item.name}</p>
                </div>
                <button type="button" disabled={!enough} onClick={() => onExchange(item)}>
                  {enough ? "兑换" : `还差${item.cost - rewards.flowers}朵`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="report-card">
        <h3>兑换记录</h3>
        {exchangeRecords.length ? exchangeRecords.map((item) => <p key={item.id}>{item.date} {item.name} -{item.cost}朵</p>) : <p>还没有兑换记录</p>}
      </section>
    </section>
  );
}

function RedoBook({ wrongItems, onBack, onClear }) {
  return (
    <section className="subpage-view">
      <PageHeader title="再练本" onBack={onBack} />
      <section className="report-card">
        <h3>今天需要再练</h3>
        {wrongItems.length ? wrongItems.map((item) => (
          <p key={item.id}>{item.lessonTitle || ""} {item.text}：正确答案 {item.answer}</p>
        )) : <p>暂无错题错字，今天状态不错。</p>}
      </section>
      <button className="modal-primary" type="button" disabled={!wrongItems.length} onClick={onClear}>完成再练</button>
    </section>
  );
}

function ReportView({ activePackage, plan, submissions, wrongItems, completion, rewards, onBack }) {
  const dayPlan = plan.days[0];
  const pending = submissions.filter((item) => item.status === "pending");
  return (
    <section className="subpage-view">
      <PageHeader title="今日学习报告" onBack={onBack} />
      <div className="overview-grid">
        <span><strong>{dayPlan.lessons.length}</strong>复习内容</span>
        <span><strong>{completion.done}/{completion.total}</strong>完成步骤</span>
        <span><strong>{rewards.todayEarned}</strong>今日小红花</span>
      </div>
      <section className="report-card">
        <h3>今日复习</h3>
        <p>{activePackage.name}</p>
        {dayPlan.lessons.map((lesson) => <p key={lesson.id}>{lesson.shortTitle}</p>)}
      </section>
      <section className="report-card">
        <h3>客观题与再练</h3>
        {wrongItems.length ? wrongItems.map((item) => <p key={item.id}>{item.text}：选错 {item.picked || "待检查"}，正确 {item.answer}</p>) : <p>暂无错题</p>}
      </section>
      <section className="report-card">
        <h3>录音/拍照检查</h3>
        {submissions.length ? submissions.map((item) => (
          <p key={item.id}>{item.lessonTitle} · {item.type}：{item.result}</p>
        )) : <p>还没有提交录音或照片</p>}
        {pending.length ? <p>有 {pending.length} 项等待系统检查</p> : null}
      </section>
      <section className="report-card">
        <h3>明日自动加练</h3>
        {wrongItems.length ? wrongItems.slice(0, 4).map((item) => <p key={`redo_${item.id}`}>{item.answer}</p>) : <p>暂无加练内容</p>}
      </section>
    </section>
  );
}

function ParentLogin({ onBack, onEnter }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="subpage-view">
      <PageHeader title="家长验证" onBack={onBack} />
      <div className="parent-password-card">
        <Key weight="fill" />
        <h2>请输入家长密码</h2>
        <input value={password} type="password" inputMode="numeric" placeholder="默认 1234" onChange={(event) => setPassword(event.target.value)} />
        {error ? <div className="feedback soft">{error}</div> : null}
        <button className="modal-primary" type="button" onClick={() => password === "1234" ? onEnter() : setError("密码不对，请再试一次")}>进入家长模式</button>
      </div>
    </section>
  );
}

function ParentHome(props) {
  const {
    packages,
    activePackage,
    plan,
    schoolProgressIndex,
    reviewOffset,
    rewardItems,
    completion,
    wrongItems,
    submissions,
  } = props;
  const [startIndex, setStartIndex] = useState(plan.startIndex);
  const [endIndex, setEndIndex] = useState(plan.endIndex);
  const [perDay, setPerDay] = useState(plan.perDay);
  const activeLessons = activePackage.lessons;
  const preview = buildPlan(activeLessons, Number(startIndex), Number(endIndex), Number(perDay), "final");

  return (
    <section className="subpage-view parent-home">
      <PageHeader title="家长模式" onBack={props.onBack} />
      <section className="parent-action-card">
        <h2>选择孩子教材</h2>
        <label>
          年级教材
          <select value={activePackage.id} onChange={(event) => props.onPackageChange(event.target.value)}>
            {packages.map((item) => <option value={item.id} key={item.id}>{item.grade} {item.subject} {item.semester}</option>)}
          </select>
        </label>
        <div className="package-meta">
          <strong>{activePackage.name}</strong>
          <span>{activePackage.sourceFile}</span>
          <p>{activePackage.contentStatus}</p>
        </div>
      </section>

      <section className="parent-action-card">
        <h2>平时复习设置</h2>
        <label>
          学校当前学到
          <select value={schoolProgressIndex} onChange={(event) => props.onProgressChange(Number(event.target.value), reviewOffset)}>
            {activeLessons.map((lesson, index) => <option value={index} key={lesson.id}>{lesson.shortTitle}</option>)}
          </select>
        </label>
        <label>
          复习规则
          <select value={reviewOffset} onChange={(event) => props.onProgressChange(schoolProgressIndex, Number(event.target.value))}>
            <option value="0">当天课</option>
            <option value="1">慢1课</option>
            <option value="2">慢2课</option>
          </select>
        </label>
        <button className="modal-primary" type="button" onClick={() => props.onProgressChange(schoolProgressIndex, reviewOffset)}>生成今日复习</button>
      </section>

      <section className="parent-action-card">
        <h2>期末总复习</h2>
        <label>
          从
          <select value={startIndex} onChange={(event) => setStartIndex(event.target.value)}>
            {activeLessons.map((lesson, index) => <option value={index} key={lesson.id}>{lesson.shortTitle}</option>)}
          </select>
        </label>
        <label>
          到
          <select value={endIndex} onChange={(event) => setEndIndex(event.target.value)}>
            {activeLessons.map((lesson, index) => <option value={index} key={lesson.id}>{lesson.shortTitle}</option>)}
          </select>
        </label>
        <label>
          每天复习
          <select value={perDay} onChange={(event) => setPerDay(event.target.value)}>
            <option value="1">1课</option>
            <option value="2">2课</option>
          </select>
        </label>
        <button className="modal-primary" type="button" onClick={() => props.onFinalPlan(preview)}>启用期末总复习计划</button>
      </section>

      <section className="calendar-card">
        <h2>期末排班预览</h2>
        {preview.days.map((day) => (
          <div className="schedule-row" key={day.id}>
            <span>{day.date} · {day.label}</span>
            <strong>{day.lessons.map((lesson) => lesson.lessonNo).join(" + ")}</strong>
            <p>{day.lessons.map((lesson) => lesson.title).join("、")}</p>
          </div>
        ))}
      </section>

      <section className="report-card">
        <h3>今日概览</h3>
        <p>已完成：{completion.done}/{completion.total}</p>
        <p>错题/再练：{wrongItems.length}</p>
        <p>录音/拍照提交：{submissions.length}</p>
      </section>

      <section className="report-card">
        <h3>奖励设置</h3>
        {rewardItems.map((item) => <p key={item.id}>{item.name}：{item.cost}朵 · {item.enabled ? "启用" : "停用"}</p>)}
      </section>
    </section>
  );
}

export function App() {
  const [page, setPage] = useState("home");
  const [activePackageId, setActivePackageId] = useState(defaultTextbookPackage.id);
  const activePackage = textbookPackages.find((item) => item.id === activePackageId) || defaultTextbookPackage;
  const [schoolProgressIndex, setSchoolProgressIndex] = useState(2);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [plan, setPlan] = useState(() => buildPlan(defaultTextbookPackage.lessons, 2, 2, 1, "daily"));
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answerState, setAnswerState] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [wrongItems, setWrongItems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [rewards, setRewards] = useState({ flowers: 26, todayEarned: 0, streakDays: 3 });
  const [rewardItems] = useState([
    { id: "story", name: "多听一个故事", cost: 10, enabled: true },
    { id: "cartoon", name: "周末动画15分钟", cost: 20, enabled: true },
    { id: "gift", name: "选一个小礼物", cost: 30, enabled: true },
  ]);
  const [exchangeRecords, setExchangeRecords] = useState([]);
  const [recording, setRecording] = useState({ isRecording: false, seconds: 0, url: "", error: "" });
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const dayPlan = plan.days[0] || buildPlan(activePackage.lessons, 0, 0, 1, "daily").days[0];
  const activeLesson = dayPlan.lessons[activeLessonIndex] || dayPlan.lessons[0];
  const activeSteps = useMemo(() => buildLessonSteps(activeLesson, activePackage), [activeLesson, activePackage]);
  const activeStep = activeSteps[activeStepIndex] || activeSteps[0];
  const stepKey = `${activeLesson.id}_${activeStep.id}`;
  const submission = submissions.find((item) => item.stepKey === stepKey);
  const totalSteps = dayPlan.lessons.reduce((sum, lesson) => sum + buildLessonSteps(lesson, activePackage).length, 0);
  const completion = { done: Object.keys(completedSteps).length, total: totalSteps };
  const pendingCount = submissions.filter((item) => item.status === "pending").length;

  function resetWork(nextPlan) {
    setPlan(nextPlan);
    setActiveLessonIndex(0);
    setActiveStepIndex(0);
    setQuizIndex(0);
    setAnswerState(null);
    setCompletedSteps({});
    setWrongItems([]);
    setSubmissions([]);
    setRecording({ isRecording: false, seconds: 0, url: "", error: "" });
  }

  function addFlowers(count) {
    setRewards((current) => ({ ...current, flowers: current.flowers + count, todayEarned: current.todayEarned + count }));
  }

  function choosePackage(packageId) {
    const nextPackage = textbookPackages.find((item) => item.id === packageId) || defaultTextbookPackage;
    const defaultIndex = nextPackage.id === defaultTextbookPackage.id ? 2 : 0;
    setActivePackageId(packageId);
    setSchoolProgressIndex(defaultIndex);
    setReviewOffset(0);
    resetWork(buildPlan(nextPackage.lessons, defaultIndex, defaultIndex, 1, "daily"));
    setPage("parent");
  }

  function applyProgress(nextProgressIndex, nextOffset) {
    const reviewIndex = Math.max(0, nextProgressIndex - nextOffset);
    setSchoolProgressIndex(nextProgressIndex);
    setReviewOffset(nextOffset);
    resetWork(buildPlan(activePackage.lessons, reviewIndex, reviewIndex, 1, "daily"));
    setPage("home");
  }

  function markStepDone(key = stepKey) {
    setCompletedSteps((current) => ({ ...current, [key]: true }));
  }

  function goNextStep() {
    setAnswerState(null);
    setQuizIndex(0);
    if (activeStepIndex < activeSteps.length - 1) {
      setActiveStepIndex((current) => current + 1);
      return;
    }
    if (activeLessonIndex < dayPlan.lessons.length - 1) {
      setActiveLessonIndex((current) => current + 1);
      setActiveStepIndex(0);
      return;
    }
    addFlowers(2);
    setPage("report");
  }

  function startToday() {
    setActiveLessonIndex(0);
    setActiveStepIndex(0);
    setQuizIndex(0);
    setAnswerState(null);
    setPage("lesson");
  }

  function handlePick(question, option) {
    const correct = option === question.answer;
    setAnswerState({ picked: option, correct });
    if (correct) {
      addFlowers(1);
    } else {
      setWrongItems((current) => [
        ...current,
        { id: `wrong_${Date.now()}`, lessonId: activeLesson.id, lessonTitle: activeLesson.shortTitle, text: question.prompt, picked: option, answer: question.answer },
      ]);
    }
  }

  function nextQuiz() {
    if (quizIndex < activeStep.questions.length - 1) {
      setQuizIndex((current) => current + 1);
      setAnswerState(null);
      return;
    }
    markStepDone();
    goNextStep();
  }

  function handlePhotoFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setSubmissions((current) => [
      {
        id: `photo_${Date.now()}`,
        stepKey,
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.shortTitle,
        type: activeStep.photoType,
        targets: activeStep.targets,
        status: "pending",
        imageUrl,
        result: activeStep.kind === "dictation" ? "模拟识别：大部分正确，错词会进入再练本" : "模拟识别：书写清晰，等待报告汇总",
      },
      ...current.filter((item) => item.stepKey !== stepKey),
    ]);
  }

  function submitPhoto() {
    addFlowers(1);
    if (activeStep.kind === "dictation" && activeStep.targets.length > 1) {
      setWrongItems((current) => [
        ...current,
        { id: `dictation_${Date.now()}`, lessonId: activeLesson.id, lessonTitle: activeLesson.shortTitle, text: "默写检查", picked: "照片识别待确认", answer: activeStep.targets[1] },
      ]);
    }
    markStepDone();
    goNextStep();
  }

  async function startRecording() {
    setRecording((current) => ({ ...current, error: "" }));
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecording((current) => ({ ...current, error: "当前浏览器不支持录音，请用 Safari 或 Chrome 打开。" }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        window.clearInterval(recordingTimerRef.current);
        setRecording({ isRecording: false, seconds: 0, url, error: "" });
      };
      mediaRecorderRef.current = recorder;
      setRecording({ isRecording: true, seconds: 0, url: "", error: "" });
      recordingTimerRef.current = window.setInterval(() => {
        setRecording((current) => ({ ...current, seconds: current.seconds + 1 }));
      }, 1000);
      recorder.start();
    } catch {
      setRecording((current) => ({ ...current, error: "没有拿到麦克风权限，请允许浏览器使用麦克风后再试。" }));
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function submitRecording() {
    if (!recording.url) return;
    addFlowers(1);
    setSubmissions((current) => [
      {
        id: `audio_${Date.now()}`,
        stepKey,
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.shortTitle,
        type: activeStep.reviewType || "朗读",
        targets: [activeStep.text],
        status: "pending",
        audioUrl: recording.url,
        result: "已录音提交，模拟识别：基本清楚",
      },
      ...current.filter((item) => item.stepKey !== stepKey),
    ]);
    markStepDone();
    setRecording({ isRecording: false, seconds: 0, url: "", error: "" });
    goNextStep();
  }

  function exchangeReward(item) {
    if (rewards.flowers < item.cost) return;
    setRewards((current) => ({ ...current, flowers: current.flowers - item.cost }));
    setExchangeRecords((current) => [{ id: `exchange_${Date.now()}`, date: today, name: item.name, cost: item.cost }, ...current]);
  }

  function renderContent() {
    if (page === "lesson") {
      return (
        <LessonView
          lesson={activeLesson}
          step={activeStep}
          stepIndex={activeStepIndex}
          totalSteps={activeSteps.length}
          quizIndex={quizIndex}
          answerState={answerState}
          submission={submission}
          recording={recording}
          onBack={() => setPage("home")}
          onPick={handlePick}
          onQuizNext={nextQuiz}
          onPhotoFile={handlePhotoFile}
          onPhotoSubmit={submitPhoto}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSubmitRecording={submitRecording}
        />
      );
    }
    if (page === "parentLogin") return <ParentLogin onBack={() => setPage("home")} onEnter={() => setPage("parent")} />;
    if (page === "parent") {
      return (
        <ParentHome
          packages={textbookPackages}
          activePackage={activePackage}
          plan={plan}
          schoolProgressIndex={schoolProgressIndex}
          reviewOffset={reviewOffset}
          rewardItems={rewardItems}
          completion={completion}
          wrongItems={wrongItems}
          submissions={submissions}
          onBack={() => setPage("home")}
          onPackageChange={choosePackage}
          onProgressChange={applyProgress}
          onFinalPlan={(nextPlan) => {
            resetWork(nextPlan);
            setPage("home");
          }}
        />
      );
    }
    if (page === "report") return <ReportView activePackage={activePackage} plan={plan} submissions={submissions} wrongItems={wrongItems} completion={completion} rewards={rewards} onBack={() => setPage("home")} />;
    if (page === "rewards") return <RewardCenter rewards={rewards} rewardItems={rewardItems} exchangeRecords={exchangeRecords} onExchange={exchangeReward} onBack={() => setPage("home")} />;
    if (page === "redo") return <RedoBook wrongItems={wrongItems} onBack={() => setPage("home")} onClear={() => setWrongItems([])} />;
    return (
      <HomeView
        activePackage={activePackage}
        plan={plan}
        rewards={rewards}
        completion={completion}
        pendingCount={pendingCount}
        redoCount={wrongItems.length}
        onStart={startToday}
        onParent={() => setPage("parentLogin")}
        onReport={() => setPage("report")}
        onRewards={() => setPage("rewards")}
        onRedo={() => setPage("redo")}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className={`phone-screen ${page !== "home" ? "task-screen" : ""}`} aria-label="复习小星球">
        <div className="screen-content no-bottom-nav">
          {renderContent()}
        </div>
      </section>
    </main>
  );
}
