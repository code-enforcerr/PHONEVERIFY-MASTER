import { useState, useCallback, useEffect } from "react";  // Added useEffect
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function PhoneChecker() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load results from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("verificationResults");
    if (saved) {
      setResults(JSON.parse(saved));
    }
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) {
      setFile(acceptedFiles[0]);
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
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("numbers", file);

    try {
      const res = await axios.post("http://localhost:3001/api/upload", formData);
      setResults(res.data.results);
      localStorage.setItem("verificationResults", JSON.stringify(res.data.results));  // Save to localStorage
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type) => {
    const url = type
      ? `http://localhost:3001/api/download/${type}`
      : "http://localhost:3001/api/download";
    window.open(url, "_blank");
  };

  // New clear results function
  const clearResults = () => {
    setResults([]);
    localStorage.removeItem("verificationResults");
  };

  const categorize = (type) => results.filter((r) => r.type === type);
  const unknowns = results.filter((r) => !["mobile", "landline", "voip"].includes(r.type));

  return (
    <div className="space-y-8 font-luxury text-slate-800">
      {/* Upload area */}
      <div
        {...getRootProps()}
        className={`transition border-2 border-dashed rounded-3xl p-10 text-center
          ${isDragActive ? "border-indigo-500" : "border-white"} cursor-pointer`}
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
        >
          {loading ? "⏳ Verifying..." : "Upload & Verify"}
        </button>

        <button
          onClick={() => handleDownload("mobile")}
          disabled={!categorize("mobile").length}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
        >
          Download Mobile
        </button>

        <button
          onClick={() => handleDownload("landline")}
          disabled={!categorize("landline").length}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
        >
          Download Landline
        </button>

        {/* Clear results button */}
        <button
          onClick={clearResults}
          disabled={!results.length}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold tracking-wide shadow hover:shadow-md disabled:opacity-40 transition"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NumberGroup title="📱 Mobile" color="emerald" data={categorize("mobile")} />
        <NumberGroup title="☎️ Landline" color="blue" data={categorize("landline")} />
        <NumberGroup title="💻 VoIP" color="purple" data={categorize("voip")} />
        <NumberGroup title="❓ Unknown/Error" color="rose" data={unknowns} />
      </div>
    </div>
  );
}

function NumberGroup({ title, data, color }) {
  return (
    <div className={`bg-${color}-50 border-2 border-${color}-400 rounded-xl p-4 shadow-sm`}>
      <h2 className={`text-${color}-800 text-lg font-bold mb-2`}>
        {title} <span className="text-sm font-normal">({data.length})</span>
      </h2>
      <div className="max-h-52 overflow-y-auto text-sm text-slate-700 space-y-1 custom-scrollbar pr-1">
        {data.map((item, idx) => (
          <div key={idx} className="truncate">{item.number}</div>
        ))}
      </div>
    </div>
  );
}
