// frontend/src/App.js
import React from 'react';
import useWebSocket from 'react-use-websocket';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://127.0.0.1:8000';
const AVATARS = ['🚀', '🤖', '👾', '🦊', '🐸', '🦄', '🐲', '👽'];
const HOST_AVATAR = '👑';

// --- Main App Component ---
function App() {
  const [view, setView] = React.useState('join');
  const [nickname, setNickname] = React.useState('');
  const [avatar, setAvatar] = React.useState(AVATARS[0]);
  const [roomCode, setRoomCode] = React.useState('');
  const [totalScores, setTotalScores] = React.useState({});

  const finalAvatar = view === 'create_quiz' ? HOST_AVATAR : avatar;

  const { sendMessage, lastJsonMessage } = useWebSocket(
    (roomCode && nickname) ? `${WS_BASE_URL}/ws/${roomCode}/${nickname}?avatar=${encodeURIComponent(finalAvatar)}` : null,
    {
      onOpen: () => { setView('lobby'); },
      shouldReconnect: (closeEvent) => true,
    }
  );
  
  React.useEffect(() => {
    if (lastJsonMessage?.state === 'results') {
      setTotalScores(prevScores => {
        const newScores = { ...prevScores };
        const { answers, players, current_question_index } = lastJsonMessage;
        
        const alreadyScored = Object.values(prevScores).some(
            player => player.lastQuestionIndex === current_question_index
        );

        if (!alreadyScored) {
            const playerInfo = players.reduce((acc, p) => ({ ...acc, [p.nickname]: p }), {});
            for (const nickname in answers) {
                if (!newScores[nickname]) {
                    newScores[nickname] = { score: 0, avatar: playerInfo[nickname]?.avatar || '👤' };
                }
                if (answers[nickname].is_correct) {
                    newScores[nickname].score += answers[nickname].time_taken;
                }
                newScores[nickname].lastQuestionIndex = current_question_index;
            }
        }
        return newScores;
      });
    } else if (lastJsonMessage?.state === 'lobby') {
      setTotalScores({});
    }
  }, [lastJsonMessage]);


  const handleJoinQuiz = () => { if (!nickname || !roomCode) return alert('Please enter a nickname and room code!'); };
  const handleProceedToCreate = () => { if (!nickname) return alert('Please enter a nickname!'); setView('create_quiz'); };
  const handleQuizCreated = (createdRoomCode) => { setRoomCode(createdRoomCode); };

  return (
    <div className="app-wrapper">
      <div className="background"></div>
      <div className="watermark">
        <div className="logo">Q</div>
        <div className="app-name">Quizo</div>
      </div>
      
      <div className="content">
        {view === 'join' && <JoinScreen {...{ nickname, setNickname, roomCode, setRoomCode, handleJoinQuiz, handleProceedToCreate, avatar, setAvatar }} />}
        {view === 'create_quiz' && <QuizCreator nickname={nickname} onQuizCreated={handleQuizCreated} />}
        {view !== 'join' && view !== 'create_quiz' && <QuizComponent {...{ lastJsonMessage, sendMessage, nickname, totalScores }} />}
      </div>

      <div className="footer">
        <p>&copy; 2025 Quizo | Developed by Rishi Raj</p>
      </div>
    </div>
  );
}

// --- Components ---
const AvatarSelector = ({ selectedAvatar, onSelectAvatar }) => (
  <div className="avatar-selector">
    <h4>CHOOSE YOUR AVATAR</h4>
    <div className="avatar-grid">
      {AVATARS.map(av => (
        <button key={av} className={`avatar-btn ${selectedAvatar === av ? 'selected' : ''}`} onClick={() => onSelectAvatar(av)}>
          {av}
        </button>
      ))}
    </div>
  </div>
);

const JoinScreen = ({ nickname, setNickname, roomCode, setRoomCode, handleJoinQuiz, handleProceedToCreate, avatar, setAvatar }) => {
  const [isJoining, setIsJoining] = React.useState(true);
  return (
    <div className="container">
      <h1>QUIZO</h1>
      <div className="join-toggle">
        <button className={isJoining ? 'active' : ''} onClick={() => setIsJoining(true)}>Join</button>
        <button className={!isJoining ? 'active' : ''} onClick={() => setIsJoining(false)}>Host</button>
      </div>
      
      <div className="input-group">
        <input type="text" placeholder="ENTER YOUR NICKNAME" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>

      {isJoining ? (
        <>
          <AvatarSelector selectedAvatar={avatar} onSelectAvatar={setAvatar} />
          <div className="input-group">
            <input type="text" placeholder="ENTER ROOM CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />
          </div>
          <button onClick={handleJoinQuiz}>Enter Room</button>
        </>
      ) : (
        <button onClick={handleProceedToCreate} className="btn-secondary">Create New Quiz</button>
      )}
    </div>
  );
};


const QuizCreator = ({ nickname, onQuizCreated }) => {
  const [title, setTitle] = React.useState('');
  const [questions, setQuestions] = React.useState([{ text: '', options: ['', '', '', ''], correct_option: 0 }]);
  const lastQuestionRef = React.useRef(null); // Create a ref

  // This effect runs whenever the number of questions changes
  React.useEffect(() => {
    if (lastQuestionRef.current) {
      lastQuestionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);
  
  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correct_option: 0 }]);
  };
  
  const handleQuestionChange = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };
  
  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };
  
  const handleCreateQuiz = async () => {
    if (!title || questions.some(q => !q.text || q.options.some(o => !o))) return alert('Please fill out all fields.');
    const res = await fetch(`${API_BASE_URL}/api/create_quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions }),
    });
    const data = await res.json();
    onQuizCreated(data.room_code);
  };

  return (
    <div className="container">
      <h2>QUIZ EDITOR // HOST: {nickname}</h2>
      <input type="text" placeholder="QUIZ TITLE" value={title} onChange={(e) => setTitle(e.target.value)} />
      {questions.map((q, qIndex) => (
        <div 
          key={qIndex} 
          className="question-editor"
          ref={qIndex === questions.length - 1 ? lastQuestionRef : null}
        >
          <h4>Question {qIndex + 1}</h4>
          <input type="text" placeholder="Question Text" value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} />
          {q.options.map((opt, oIndex) => (
            <div key={oIndex} className="option-editor">
              <input type="radio" name={`correct_q${qIndex}`} checked={q.correct_option === oIndex} onChange={() => handleQuestionChange(qIndex, 'correct_option', oIndex)}/>
              <input type="text" placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={handleAddQuestion} className="btn-secondary">Add Question</button>
      <button onClick={handleCreateQuiz}>Launch Quiz</button>
    </div>
  );
};

const QuizComponent = ({ lastJsonMessage, sendMessage, nickname, totalScores }) => {
  if (!lastJsonMessage) return <div className="container"><h2>CONNECTING...</h2></div>;
  const { state } = lastJsonMessage;
  const isHost = lastJsonMessage?.host === nickname;
  return (
    <div className="container">
        {state === "lobby" && <Lobby {...{ lastJsonMessage, sendMessage, isHost }} />}
        {state === "question" && <Question {...{ lastJsonMessage, sendMessage, nickname, isHost }} />}
        {state === "results" && <Results {...{ lastJsonMessage, sendMessage, isHost, nickname, totalScores }} />}
        {state === "finished" && <Finished {...{ totalScores, players: lastJsonMessage.players }} />}
    </div>
  );
};

const Lobby = ({ lastJsonMessage, sendMessage, isHost }) => {
  const { room_code, players } = lastJsonMessage;
  const handleStartQuiz = () => sendMessage(JSON.stringify({ action: "start_quiz" }));
  return (
    <>
      <h2>LOBBY</h2>
      <h3>ROOM CODE: <span className="room-code">{room_code}</span></h3>
      <div className="player-list"><h4>PARTICIPANTS [{players.length}]</h4>
        <ul>{players.map((p) => (<li key={p.nickname}><span className="avatar">{p.avatar}</span> {p.nickname}</li>))}</ul>
      </div>
      {isHost && players.length > 1 && <button onClick={handleStartQuiz}>Start Quiz</button>}
    </>
  );
};

const Question = ({ lastJsonMessage, sendMessage, nickname, isHost }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const { quiz_data, current_question_index, answers, players, host } = lastJsonMessage;
  const question = quiz_data.questions[current_question_index];
  const hasAnswered = answers && nickname in answers;
  const playerCount = players.filter(p => p.nickname !== host).length;
  React.useEffect(() => { setSelectedAnswer(null); }, [current_question_index]);
  const handleSubmitAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    sendMessage(JSON.stringify({ action: "submit_answer", answer_index: answerIndex }));
  };
  return (
    <>
      <h2>{quiz_data.title}</h2><h3>{question.text}</h3>
      {isHost && <p className="host-notice">// Awaiting Player Responses</p>}
      <div className="options">{question.options.map((option, index) => (<button key={index} onClick={() => handleSubmitAnswer(index)} disabled={hasAnswered || isHost} className={selectedAnswer === index ? 'selected' : ''}>{option}</button>))}</div>
      <div className="player-list"><h4>Answered [{Object.keys(answers).length}/{playerCount > 0 ? playerCount : 1}]</h4>
        <ul>{players.map(p => { if (p.nickname === host) return null; return (<li key={p.nickname} style={{ opacity: answers[p.nickname] !== undefined ? 1 : 0.4 }}><span className="avatar">{p.avatar}</span> {p.nickname}</li>) })}</ul>
      </div>
    </>
  );
};

const Results = ({ lastJsonMessage, sendMessage, isHost, nickname, totalScores }) => {
    const { quiz_data, current_question_index, answers } = lastJsonMessage;
    const question = quiz_data.questions[current_question_index];
    const myAnswerData = answers[nickname];
    const correctAnswer = question.correct_option;
    const handleNextQuestion = () => sendMessage(JSON.stringify({ action: "next_question" }));
    return (
        <>
            <h2>RESULTS</h2><h3>{question.text}</h3>
            <div className="results">
                <p>The correct answer was: <strong>{question.options[correctAnswer]}</strong></p>
                {!isHost && myAnswerData && (<p className={myAnswerData.is_correct ? 'correct' : 'incorrect'}>Your response was {myAnswerData.is_correct ? `CORRECT [${myAnswerData.time_taken.toFixed(2)}s]` : 'INCORRECT.'}</p>)}
            </div>
            <Scoreboard scores={totalScores} players={lastJsonMessage.players} />
            {isHost && <button onClick={handleNextQuestion}>Next Question</button>}
        </>
    );
};

const Finished = ({ totalScores, players }) => (
    <>
        <h2>QUIZ FINISHED</h2>
        <h3>FINAL SCORES</h3>
        <Scoreboard scores={totalScores} players={players} />
    </>
);

const Scoreboard = ({ scores, players }) => {
  const playerInfo = players.reduce((acc, p) => ({ ...acc, [p.nickname]: p }), {});
  return (
    <div className="scoreboard">
        <h4>LEADERBOARD</h4>
        <ul>
            {Object.entries(scores)
                .sort(([, a], [, b]) => a.score - b.score)
                .map(([name, data]) => (<li key={name}><span className="avatar">{playerInfo[name]?.avatar}</span> {name}: {data.score.toFixed(2)} seconds</li>
            ))}
        </ul>
    </div>
)};

export default App;
