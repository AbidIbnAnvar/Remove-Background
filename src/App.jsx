import './App.css';
import React,{ useState } from 'react';
import { FilePond, registerPlugin} from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileMetadata from 'filepond-plugin-file-metadata';
import FilePondPluginFilePoster from 'filepond-plugin-file-poster';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import 'filepond/dist/filepond.min.css';
import axios from 'axios';
 
registerPlugin(FilePondPluginImagePreview,
  FilePondPluginFileEncode,
  FilePondPluginFileMetadata,
  FilePondPluginFilePoster,
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType
);




function App() {
  // const [file, setFile] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const [error, setError] = useState(null);
  const [imageURL, setImageURL] = useState(null);


  const handleFileUpload = async (file) => {
    console.log('Hello');
    if (!file || file.length === 0) {
      setError('No file uploaded');
      return;
    }
    console.log('Hello');
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/remove-bg', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }, 
        responseType: 'blob',
      });


      setImageURL(URL.createObjectURL(response.data));
      console.log('Processed image URL:', imageURL);

      if (response.status === 200) {
        setResult(true);
      } else {
        throw new Error('Failed to remove background');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  return (
  
    <div className='min-h-screen bg-[#020727] bg-fixed poppins-regular'>
      <div className="grid grid-rows-1 grid-cols-1 gap-2">
        <h1 className='text-white font-bold mx-auto mt-20 text-center text-5xl'>Image
          Background
          Remover</h1>
        <h1 className='text-gray-400 col-span-3 mx-auto px-4 min-w-52 max-w-160 text-center text-xl h-auto flex items-center my-8  '>Remove backgrounds from your photos with ease! Upload your picture and get transparent background instantly.</h1>
        <div className='flex justify-center items-center w-full'>
          <div className='w-full min-w-80 max-w-120 pl-3' style={{ textAlign: 'center' }}>
            <FilePond
              acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg']}
              allowMultiple={false}
              onupdatefiles={(fileItems) => {
                if (fileItems.length > 0) {
                  handleFileUpload(fileItems[0]);
                }
              }}
              onremovefile={() => { setError(null); setLoading(false); setResult(false); }}
            />
            {loading && <p className="py-10 text-white">Generating...</p>}
            {!loading && error && <p className="py-10 text-white">{error}</p>}
            {result &&
              <div className='my-4'>
                <p className='text-white font-semibold text-xl'>Click on the image to download</p>
                <div className='bg-[#021550] rounded-3xl'>
                  <a href='http://localhost:5000/download' className='text-white px-16 py-4 rounded-lg'>
                    <img src={imageURL} alt="" className='min-w-24 max-w-64 mx-auto'/>
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </div> 
      <div className='mt-20 pb-10' >
        <h1 className='text-white text-center font-bold text-4xl'>How to use</h1>
        <div className='flex flex-row flex-wrap w-auto justify-evenly gap-8 mx-8 my-16'>
          <div className='flex flex-col flex-initial gap-2 text-white bg-[#021550] w-120 min-w-72 max-w-96 py-12 px-8 rounded-2xl'>
            <div className='text-[#0140df] font-bold text-2xl'>Step 1</div>
            <div className='text-2xl font-bold'>Select an Image</div>
            <div>Click the browse button to select an image file from your device. Only one file can be uploaded at a time.</div>
          </div>
          <div className='flex flex-col flex-initial gap-2 text-white bg-[#021550] w-120 min-w-72 max-w-96 py-12 px-8 rounded-2xl'>
            <div className='text-[#0140df] font-bold text-2xl'>Step 2</div>
            <div className='text-2xl font-bold'>Remove Background</div>
            <div>Once the image is uploaded, the background removal process will begin automatically. Wait for the process to complete.</div>
          </div>
          <div className='flex flex-col flex-initial gap-2 text-white bg-[#021550] w-120 min-w-72 max-w-96 py-12 px-8 rounded-2xl'>
            <div className='text-[#0140df] font-semibold text-2xl'>Step 3</div>
            <div className='text-2xl font-bold'>Download the Result</div>
            <div>After the background is removed, click on the processed image displayed on the screen to download it with the background removed.</div>
          </div>
        </div>
        </div>
    </div>

    
  );
}

export default App;
