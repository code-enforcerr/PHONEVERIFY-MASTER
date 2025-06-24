import PhoneChecker from "./components/PhoneChecker";

function App() {
  return (
    <div className="min-h-screen bg-[url('/filing-taxes-smartphone.jpg')] bg-cover bg-no-repeat from-indigo-100 to-slate-200 flex items-center justify-center p-6">
      <div className="bg-white bg-opacity-70 backdrop-blur-lg border border-slate-200 rounded-3xl shadow-2xl p-10 w-full max-w-7xl">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-800 font-luxury tracking-tight">
          📞 Line Type Verifier
        </h1>
        <PhoneChecker />
      </div>
    </div>
  );
}

export default App;
