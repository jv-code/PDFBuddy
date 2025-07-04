import React, { useState } from 'react';
import { FileText, Merge, Split, Compass as Compress, RotateCw, Upload, Download, ArrowLeft, CheckCircle, Zap, XCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  buttonGradient: string;
}

const tools: Tool[] = [
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one document',
    icon: <Merge className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonGradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract pages or split PDF into multiple files',
    icon: <Split className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    buttonGradient: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    icon: <Compress className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    buttonGradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
  },
  {
    id: 'convert',
    name: 'Convert PDF',
    description: 'Convert PDFs to other formats or vice versa',
    icon: <RotateCw className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    buttonGradient: 'bg-gradient-to-r from-orange-500 to-orange-600'
  }
];

function App() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [splitRanges, setSplitRanges] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (selectedTool === 'merge') {
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    } else {
      setFiles(newFiles);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleProcess = async () => {
    if (!selectedTool) return;

    setIsProcessing(true);
    setDownloadUrl(null);

    const formData = new FormData();

    if (selectedTool === 'merge') {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else if (selectedTool === 'split') {
      if (files.length > 0) {
        formData.append('file', files[0]);
      }
      formData.append('ranges', splitRanges);
    } else if (selectedTool === 'compress') {
      if (files.length > 0) {
        formData.append('file', files[0]);
      }
    }

    try {
      const response = await fetch(`http://localhost:3001/${selectedTool}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsComplete(true);
    } catch (error) {
      console.error('Error processing files:', error);
      // Here you could set an error state and display a message to the user
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setSelectedTool(null);
    setFiles([]);
    setIsProcessing(false);
    setIsComplete(false);
    setDownloadUrl(null);
    setSplitRanges('');
  };

  const selectedToolData = tools.find(tool => tool.id === selectedTool);

  const isButtonDisabled = files.length === 0 || isProcessing || (selectedTool === 'split' && !splitRanges);

  if (selectedTool && selectedToolData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={resetTool}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Tools
                </button>
              </div>
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-indigo-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">PDF Tools</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${selectedToolData.bgColor} ${selectedToolData.color} mb-4`}>
              {selectedToolData.icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedToolData.name}</h1>
            <p className="text-gray-600 text-lg">{selectedToolData.description}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {!isComplete ? (
              <>
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="mb-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-700">
                          Click to upload or drag and drop
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          multiple={selectedTool === 'merge'}
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <p className="text-gray-500">
                      {selectedTool === 'merge' ? 'Upload multiple PDF files' : 'Upload a single PDF file'}
                    </p>
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Files</h3>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-red-500 mr-3" />
                          <span className="text-gray-700 flex-1 truncate pr-2">{file.name}</span>
                          <span className="text-gray-500 text-sm mr-3">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Split Ranges Input */}
                {selectedTool === 'split' && files.length > 0 && (
                  <div className="mb-6">
                    <label htmlFor="split-ranges" className="block text-lg font-medium text-gray-900 mb-3">
                      Pages to Extract
                    </label>
                    <input
                      type="text"
                      id="split-ranges"
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      placeholder="e.g., 1-3, 5, 8"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Enter page numbers or ranges separated by commas.
                    </p>
                  </div>
                )}

                {/* Process Button */}
                <div className="text-center">
                  <button
                    onClick={handleProcess}
                    disabled={isButtonDisabled}
                    className={[
                      'inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all',
                      isButtonDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : selectedToolData.buttonGradient + ' text-white hover:shadow-lg transform hover:scale-105',
                    ].join(' ')}
                  >
                    {isProcessing ? (
                      <>
                        <Zap className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Process PDF
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h3>
                <p className="text-gray-600 mb-6">Your PDF has been successfully processed.</p>
                <div className="space-y-3">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={`${selectedTool}-result.pdf`}
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Result
                    </a>
                  )}
                  <div>
                    <button
                      onClick={resetTool}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Process Another File
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-indigo-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">PDF Tools</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Professional PDF Tools
            <span className="block text-indigo-600">All in One Place</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Merge, split, compress, and convert your PDF files with ease. 
            Fast, secure, and completely free to use.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No registration required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              100% secure processing
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Lightning fast
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 ${tool.borderColor} hover:border-opacity-50 transform hover:scale-105`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${tool.bgColor} ${tool.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{tool.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                  Get started
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Our PDF Tools?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Process your files in seconds with our optimized algorithms.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Secure</h3>
              <p className="text-gray-600">Your files are processed locally and never stored on our servers.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">High Quality</h3>
              <p className="text-gray-600">Maintain the original quality of your documents throughout processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-400 mr-2" />
            <span className="text-2xl font-bold">PDF Tools</span>
          </div>
          <p className="text-gray-400 mb-4">
            Professional PDF processing tools for everyone. Free, fast, and secure.
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 PDF Tools. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;