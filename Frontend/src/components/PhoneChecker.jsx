// import { useState, useCallback, useEffect } from "react";
// import { useDropzone } from "react-dropzone";
// import axios from "axios";

// export default function PhoneChecker() {
//   const [file, setFile] = useState(null);
//   const [fileNumbers, setFileNumbers] = useState([]);
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [progress, setProgress] = useState(0);
//   const [total, setTotal] = useState(0);

//   useEffect(() => {
//     const saved = localStorage.getItem("verificationResults");
//     if (saved) {
//       setResults(JSON.parse(saved));
//     }
//   }, []);

//   const onDrop = useCallback((acceptedFiles) => {
//     if (acceptedFiles.length) {
//       const uploadedFile = acceptedFiles[0];
//       setFile(uploadedFile);
//       setProgress(0);
//       setResults([]);
//       setErrorMsg("");
//       setTotal(0);
//       setFileNumbers([]);

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const text = e.target.result;
//         const lines = text
//           .split(/\r?\n/)
//           .map((line) => line.trim())
//           .filter((line) => line.length > 0);

//         const uniqueNumbers = Array.from(new Set(lines));
//         setFileNumbers(uniqueNumbers);
//         setTotal(uniqueNumbers.length);
//       };
//       reader.readAsText(uploadedFile);
//     }
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "text/csv": [".csv"],
//       "text/plain": [".txt"],
//     },
//     maxFiles: 1,
//   });

//   const handleUpload = async () => {
//     if (!fileNumbers.length) return;

//     setLoading(true);
//     setErrorMsg("");
//     setResults([]);
//     setProgress(0);
//     setTotal(fileNumbers.length);

//     const verified = [];

//     for (let i = 0; i < fileNumbers.length; i++) {
//       const number = fileNumbers[i];

//       try {
//         const res = await axios.get("http://localhost:3001/api/verify-one", {
//           params: { number },
//         });
//         verified.push(res.data);
//       } catch (err) {
//         verified.push({
//           number,
//           type: "error",
//           carrier: "error",
//           valid: false,
//           error: err.message,
//         });
//       }

//       setProgress((prev) => prev + 1);
//       await new Promise((resolve) => setTimeout(resolve, 300));
//     }

//     setResults(verified);
//     localStorage.setItem("verificationResults", JSON.stringify(verified));
//     setLoading(false);
//   };

//   const handleDownload = (type) => {
//     const url = type
//       ? `http://localhost:3001/api/download/${type}`
//       : "http://localhost:3001/api/download";
//     window.open(url, "_blank");
//   };

//   const clearResults = () => {
//     setFile(null);
//     setResults([]);
//     setProgress(0);
//     setTotal(0);
//     setErrorMsg("");
//     setFileNumbers([]);
//     localStorage.removeItem("verificationResults");
//   };

//   const categorize = (type) => results.filter((r) => r.type === type);
//   const unknowns = results.filter((r) => !["mobile", "landline", "voip"].includes(r.type));

//   return (
//     <div className="space-y-8 font-luxury text-slate-800 max-w-4xl mx-auto p-4">
//       <div
//         {...getRootProps()}
//         className={`transition border-2 border-dashed rounded-3xl p-10 text-center
//           ${isDragActive ? "border-indigo-500" : "border-gray-300"} cursor-pointer`}
//       >
//         <input {...getInputProps()} />
//         <p className="text-lg">
//           {isDragActive
//             ? "🎯 Drop your file here..."
//             : "📂 Drag & Drop your CSV or TXT file here"}
//         </p>
//         {file && (
//           <p className="mt-3 text-indigo-600 font-medium">📎 Selected: {file.name}</p>
//         )}
//       </div>

//       <div className="text-center text-sm text-gray-600">
//         <strong>{fileNumbers.length}</strong> numbers ready for verification
//       </div>

//       <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//         <button
//           onClick={handleUpload}
//           disabled={loading || !fileNumbers.length}
//           className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
//         >
//           Start Verification
//         </button>
//       </div>

//       {fileNumbers.length > 0 && !loading && (
//         <div className="max-h-48 overflow-y-auto border rounded p-4 bg-gray-50 text-sm text-slate-700 space-y-1 custom-scrollbar mt-4">
//           {fileNumbers.map((num, idx) => (
//             <div key={idx} className="truncate">{num}</div>
//           ))}
//         </div>
//       )}

//       {loading && (
//         <div className="text-center">
//           <p className="text-indigo-600 font-semibold mb-2">⏳ Verifying numbers...</p>
//           <progress value={progress} max={total} className="w-full h-2 rounded" />
//           <p className="text-sm text-gray-500 mt-1">
//             Verified {progress} of {total}
//           </p>
//         </div>
//       )}

//       {errorMsg && (
//         <div className="text-red-600 font-medium text-center">{errorMsg}</div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <NumberGroup title="📱 Mobile" color="emerald" data={categorize("mobile")} />
//         <NumberGroup title="☎️ Landline" color="blue" data={categorize("landline")} />
//         <NumberGroup title="💻 VoIP" color="purple" data={categorize("voip")} />
//         <NumberGroup title="❓ Unknown/Error" color="rose" data={unknowns} />
//       </div>

//       <div className="flex flex-wrap gap-4 justify-center mt-6">
//         <button
//           onClick={() => handleDownload("mobile")}
//           disabled={!categorize("mobile").length}
//           className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
//         >
//           Download Mobile
//         </button>

//         <button
//           onClick={() => handleDownload("landline")}
//           disabled={!categorize("landline").length}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
//         >
//           Download Landline
//         </button>

//         <button
//           onClick={clearResults}
//           className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md transition"
//         >
//           🗑️ Clear
//         </button>
//       </div>
//     </div>
//   );
// }

// function NumberGroup({ title, data, color }) {
//   const bgColor = {
//     emerald: 'bg-emerald-50 border-emerald-400 text-emerald-800',
//     blue: 'bg-blue-50 border-blue-400 text-blue-800',
//     purple: 'bg-purple-50 border-purple-400 text-purple-800',
//     rose: 'bg-rose-50 border-rose-400 text-rose-800',
//   }[color];

//   return (
//     <div className={`border-2 rounded-xl p-4 shadow-sm ${bgColor}`}>
//       <h2 className="text-lg font-bold mb-2">
//         {title} <span className="text-sm font-normal">({data.length})</span>
//       </h2>
//       <div className="max-h-52 overflow-y-auto text-sm text-slate-700 space-y-1 custom-scrollbar pr-1">
//         {data.length > 0 ? (
//           data.map((item, idx) => (
//             <div key={idx} className="truncate">{item.number}</div>
//           ))
//         ) : (
//           <div className="text-gray-400 italic">No numbers</div>
//         )}
//       </div>
//     </div>
//   );
// }



import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function PhoneChecker() {
  const [file, setFile] = useState(null);
  const [fileNumbers, setFileNumbers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const baseURL = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    const saved = localStorage.getItem("verificationResults");
    if (saved) {
      setResults(JSON.parse(saved));
    }
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setProgress(0);
      setResults([]);
      setErrorMsg("");
      setTotal(0);
      setFileNumbers([]);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const uniqueNumbers = Array.from(new Set(lines));
        setFileNumbers(uniqueNumbers);
        setTotal(uniqueNumbers.length);
      };
      reader.readAsText(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!fileNumbers.length) return;

    setLoading(true);
    setErrorMsg("");
    setResults([]);
    setProgress(0);
    setTotal(fileNumbers.length);

    const verified = [];

    for (let i = 0; i < fileNumbers.length; i++) {
      const number = fileNumbers[i];

      try {
        const res = await axios.get(`${baseURL}/api/verify-one`, {
          params: { number },
        });
        verified.push(res.data);
      } catch (err) {
        verified.push({
          number,
          type: "error",
          carrier: "error",
          valid: false,
          error: err.message,
        });
      }

      setProgress((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setResults(verified);
    localStorage.setItem("verificationResults", JSON.stringify(verified));
    setLoading(false);
  };

  const clearResults = () => {
    setFile(null);
    setResults([]);
    setProgress(0);
    setTotal(0);
    setErrorMsg("");
    setFileNumbers([]);
    localStorage.removeItem("verificationResults");
  };

  const categorize = (type) => results.filter((r) => r.type === type);
  const unknowns = results.filter((r) => !["mobile", "landline", "voip"].includes(r.type));

  return (
    <div className="space-y-8 font-luxury text-slate-800 max-w-4xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`transition border-2 border-dashed rounded-3xl p-10 text-center
          ${isDragActive ? "border-indigo-500" : "border-gray-300"} cursor-pointer`}
      >
        <input {...getInputProps()} />
        <p className="text-lg">
          {isDragActive
            ? "🎯 Drop your file here..."
            : "📂 Drag & Drop your CSV or TXT file here"}
        </p>
        {file && (
          <p className="mt-3 text-indigo-600 font-medium">📎 Selected: {file.name}</p>
        )}
      </div>

      <div className="text-center text-sm text-gray-600">
        ✅ <strong>{fileNumbers.length}</strong> numbers ready for verification
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleUpload}
          disabled={loading || !fileNumbers.length}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
        >
          Start Verification
        </button>
      </div>

      {fileNumbers.length > 0 && !loading && (
        <div className="max-h-48 overflow-y-auto border rounded p-4 bg-gray-50 text-sm text-slate-700 space-y-1 custom-scrollbar mt-4">
          {fileNumbers.map((num, idx) => (
            <div key={idx} className="truncate">{num}</div>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center">
          <p className="text-indigo-600 font-semibold mb-2">⏳ Verifying numbers...</p>
          <progress value={progress} max={total} className="w-full h-2 rounded" />
          <p className="text-sm text-gray-500 mt-1">
            Verified {progress} of {total}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="text-red-600 font-medium text-center">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NumberGroup title="📱 Mobile" color="emerald" data={categorize("mobile")} />
        <NumberGroup title="☎️ Landline" color="blue" data={categorize("landline")} />
        <NumberGroup title="💻 VoIP" color="purple" data={categorize("voip")} />
        <NumberGroup title="❓ Unknown/Error" color="rose" data={unknowns} />
      </div>

      <div className="flex flex-wrap gap-4 justify-center mt-6">
        <button
          onClick={clearResults}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md transition"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}

function NumberGroup({ title, data, color }) {
  const bgColor = {
    emerald: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    blue: 'bg-blue-50 border-blue-400 text-blue-800',
    purple: 'bg-purple-50 border-purple-400 text-purple-800',
    rose: 'bg-rose-50 border-rose-400 text-rose-800',
  }[color];

  return (
    <div className={`border-2 rounded-xl p-4 shadow-sm ${bgColor}`}>
      <h2 className="text-lg font-bold mb-2">
        {title} <span className="text-sm font-normal">({data.length})</span>
      </h2>
      <div className="max-h-52 overflow-y-auto text-sm text-slate-700 space-y-1 custom-scrollbar pr-1">
        {data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="truncate">{item.number}</div>
          ))
        ) : (
          <div className="text-gray-400 italic">No numbers</div>
        )}
      </div>
    </div>
  );
}