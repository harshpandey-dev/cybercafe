import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import HomeScreen from './components/HomeScreen';
import AddDocumentModal from './components/AddDocumentModal';
import CropScreen from './components/CropScreen';
import PageListScreen from './components/PageListScreen';
import PdfReadyScreen from './components/PdfReadyScreen';
import PdfPreviewModal from './components/PdfPreviewModal';
import AadhaarDetailsScreen from './components/AadhaarDetailsScreen';
import ReviewEmailScreen from './components/ReviewEmailScreen';
import QrCodeScreen from './components/QrCodeScreen';
import CustomerCaseView from './components/CustomerCaseView';
import { createPdfFromImages } from './utils/pdfGenerator';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Check if current URL path is a scanned customer route e.g. /case/12345
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation step state: 'HOME' | 'ADD_PAGE' | 'CROP' | 'PAGE_LIST' | 'PDF_READY' | 'AADHAAR_DETAILS' | 'REVIEW_EMAIL' | 'QR_CODE'
  const [currentStep, setCurrentStep] = useState('HOME');

  // List of saved cropped document pages
  const [pages, setPages] = useState([]);

  // Active raw image currently being cropped/edited
  const [currentRawImage, setCurrentRawImage] = useState(null);

  // Index of page being edited
  const [editingPageIndex, setEditingPageIndex] = useState(null);

  // Generated PDF metadata: { pdfBlob, pdfBytes, pdfUrl, pdfBase64, sizeFormatted, pageCount }
  const [generatedPdf, setGeneratedPdf] = useState(null);

  // Form details for Aadhaar Update
  const [aadhaarDetails, setAadhaarDetails] = useState(null);

  // Created temporary case data: { caseId, expiresAt, localIp }
  const [createdCaseData, setCreatedCaseData] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('help@uidai.gov.in');

  // PDF Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Loading states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  useEffect(() => {
    return () => {
      if (generatedPdf?.pdfUrl) URL.revokeObjectURL(generatedPdf.pdfUrl);
    };
  }, [generatedPdf?.pdfUrl]);

  useEffect(() => {
    if (currentStep !== 'REVIEW_EMAIL') return;

    let isActive = true;
    fetch('/api/config')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load email configuration.');
        return response.json();
      })
      .then((data) => {
        if (isActive) setEmailRecipient(data.emailRecipient || 'help@uidai.gov.in');
      })
      .catch(() => {
        if (isActive) setEmailRecipient('help@uidai.gov.in');
      });

    return () => { isActive = false; };
  }, [currentStep]);

  // ROUTE 1: Customer Phone Scanned Page (/case/:caseId)
  if (pathname.startsWith('/case/')) {
    const caseId = pathname.split('/case/')[1];
    return <CustomerCaseView caseId={caseId} />;
  }

  // ROUTE 2: Cyber Cafe Operator Wizard App

  const handleStartNewDocument = () => {
    setPages([]);
    setCurrentRawImage(null);
    setEditingPageIndex(null);
    setGeneratedPdf(null);
    setAadhaarDetails(null);
    setCreatedCaseData(null);
    setEmailRecipient('');
    setCurrentStep('ADD_PAGE');
  };

  const handleSelectImageForCrop = (imageSrc) => {
    setCurrentRawImage(imageSrc);
    setCurrentStep('CROP');
  };

  const handleSaveCroppedPage = (croppedPageData) => {
    const newPageObj = {
      id: editingPageIndex !== null ? pages[editingPageIndex].id : `page_${Date.now()}_${Math.random()}`,
      croppedImage: croppedPageData.croppedImage,
      rawImageSrc: croppedPageData.rawImageSrc,
      cropData: croppedPageData.cropData,
    };

    if (editingPageIndex !== null) {
      const updated = [...pages];
      updated[editingPageIndex] = newPageObj;
      setPages(updated);
      setEditingPageIndex(null);
    } else {
      setPages((prev) => [...prev, newPageObj]);
    }

    setCurrentRawImage(null);
    setCurrentStep('PAGE_LIST');
  };

  const handleEditPage = (index) => {
    const pageToEdit = pages[index];
    setEditingPageIndex(index);
    setCurrentRawImage(pageToEdit.rawImageSrc || pageToEdit.croppedImage);
    setCurrentStep('CROP');
  };

  const handleDeletePage = (indexToDelete) => {
    const updated = pages.filter((_, idx) => idx !== indexToDelete);
    setPages(updated);
    if (updated.length === 0) {
      setCurrentStep('ADD_PAGE');
    }
  };

  const handleCancelCrop = () => {
    setCurrentRawImage(null);
    setEditingPageIndex(null);
    setCurrentStep(pages.length > 0 ? 'PAGE_LIST' : 'ADD_PAGE');
  };

  const handleRetake = () => {
    setCurrentRawImage(null);
    setCurrentStep('ADD_PAGE');
  };

  const handleCreatePdf = async () => {
    if (pages.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      const croppedImageUrls = pages.map((p) => p.croppedImage);
      const result = await createPdfFromImages(croppedImageUrls);
      
      const pdfUrl = URL.createObjectURL(result.pdfBlob);

      // Convert Uint8Array to base64 for API case submission
      let binaryStr = '';
      const bytes = result.pdfBytes;
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binaryStr);

      setGeneratedPdf({
        ...result,
        pdfUrl,
        pdfBase64,
        pdfFilename: `Aadhaar_DOB_LimitCross_Documents.pdf`,
      });

      setCurrentStep('PDF_READY');
    } catch (err) {
      console.error('Failed to create PDF:', err);
      alert('Error creating PDF file. Please check image pages and try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSavePdf = () => {
    if (!generatedPdf) return;

    const downloadLink = document.createElement('a');
    downloadLink.href = generatedPdf.pdfUrl;
    downloadLink.download = generatedPdf.pdfFilename || `Document_Scan.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleSubmitAadhaarDetails = (details) => {
    setAadhaarDetails(details);
    setCurrentStep('REVIEW_EMAIL');
  };

  const handleCreateCustomerCase = async ({ subject, body }) => {
    if (!generatedPdf?.pdfBase64 || !aadhaarDetails) {
      alert('Missing document or Aadhaar details.');
      return;
    }

    try {
      setIsCreatingCase(true);
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aadhaarDetails.name,
          aadhaarNumber: aadhaarDetails.aadhaarNumber,
          oldDob: aadhaarDetails.oldDob,
          newDob: aadhaarDetails.newDob,
          enrollmentNumber: aadhaarDetails.enrollmentNumber,
          enrollmentDateTime: `${aadhaarDetails.enrollmentDate} ${aadhaarDetails.enrollmentTime}`,
          emailSubject: subject,
          emailBody: body,
          pdfBase64: generatedPdf.pdfBase64,
          pdfFilename: `Aadhaar_Documents_${aadhaarDetails.enrollmentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create temporary case');
      }

      const caseResult = await response.json();
      setCreatedCaseData({
        ...caseResult,
        aadhaarMasked: `XXXX-XXXX-${aadhaarDetails.aadhaarNumber.slice(-4)}`,
      });

      setCurrentStep('QR_CODE');
    } catch (err) {
      console.error('Error creating customer case:', err);
      alert('Failed to generate customer QR code. Make sure backend server is running.');
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'ADD_PAGE':
        if (pages.length > 0) setCurrentStep('PAGE_LIST');
        else setCurrentStep('HOME');
        break;
      case 'CROP':
        if (editingPageIndex !== null) {
          setEditingPageIndex(null);
          setCurrentStep('PAGE_LIST');
        } else if (pages.length > 0) {
          setCurrentStep('PAGE_LIST');
        } else {
          setCurrentStep('ADD_PAGE');
        }
        break;
      case 'PAGE_LIST':
        setCurrentStep('ADD_PAGE');
        break;
      case 'PDF_READY':
        setCurrentStep('PAGE_LIST');
        break;
      case 'AADHAAR_DETAILS':
        setCurrentStep('PDF_READY');
        break;
      case 'REVIEW_EMAIL':
        setCurrentStep('AADHAAR_DETAILS');
        break;
      case 'QR_CODE':
        setCurrentStep('REVIEW_EMAIL');
        break;
      default:
        setCurrentStep('HOME');
    }
  };

  const handleReset = () => {
    setPages([]);
    setCurrentRawImage(null);
    setEditingPageIndex(null);
    setGeneratedPdf(null);
    setAadhaarDetails(null);
    setCreatedCaseData(null);
    setEmailRecipient('');
    setCurrentStep('HOME');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header
        currentStep={currentStep}
        onBack={handleBack}
        onReset={handleReset}
        pageCount={pages.length}
      />

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Main Screen Body */}
      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        {/* Step 1: HOME */}
        {currentStep === 'HOME' && (
          <HomeScreen onStart={handleStartNewDocument} />
        )}

        {/* Step 2: ADD PAGE */}
        {currentStep === 'ADD_PAGE' && (
          <AddDocumentModal
            onSelectImage={handleSelectImageForCrop}
            onCancel={() => setCurrentStep('PAGE_LIST')}
            pageCount={pages.length}
          />
        )}

        {/* Step 3: CROP */}
        {currentStep === 'CROP' && currentRawImage && (
          <CropScreen
            imageSrc={currentRawImage}
            onSaveCroppedPage={handleSaveCroppedPage}
            onRetake={handleRetake}
            onCancel={handleCancelCrop}
            initialCropData={
              editingPageIndex !== null ? pages[editingPageIndex]?.cropData : null
            }
          />
        )}

        {/* Step 4: PAGE LIST */}
        {currentStep === 'PAGE_LIST' && (
          <PageListScreen
            pages={pages}
            onReorderPages={setPages}
            onAddAnotherPage={() => setCurrentStep('ADD_PAGE')}
            onEditPage={handleEditPage}
            onDeletePage={handleDeletePage}
            onCreatePdf={handleCreatePdf}
          />
        )}

        {/* Step 5: PDF READY */}
        {currentStep === 'PDF_READY' && (
          <PdfReadyScreen
            pdfInfo={generatedPdf}
            onPreviewPdf={() => setShowPreviewModal(true)}
            onSavePdf={handleSavePdf}
            onCreateAnother={handleReset}
            onContinueToAadhaar={() => setCurrentStep('AADHAAR_DETAILS')}
          />
        )}

        {/* V2A STEP 1: AADHAAR DETAILS FORM */}
        {currentStep === 'AADHAAR_DETAILS' && (
          <AadhaarDetailsScreen
            initialDetails={aadhaarDetails}
            onSubmitDetails={handleSubmitAadhaarDetails}
          />
        )}

        {/* V2A STEP 2: REVIEW EMAIL */}
        {currentStep === 'REVIEW_EMAIL' && (
          <ReviewEmailScreen
            aadhaarDetails={aadhaarDetails}
            pdfFilename={generatedPdf?.pdfFilename}
            emailRecipient={emailRecipient}
            onEditDetails={() => setCurrentStep('AADHAAR_DETAILS')}
            onCreateQr={handleCreateCustomerCase}
            isCreatingCase={isCreatingCase}
          />
        )}

        {/* V2A STEP 3: QR CODE SCREEN */}
        {currentStep === 'QR_CODE' && createdCaseData && (
          <QrCodeScreen
            caseData={createdCaseData}
            onBack={() => setCurrentStep('REVIEW_EMAIL')}
          />
        )}

        {/* Loading Spinner overlay during PDF Generation */}
        {isGeneratingPdf && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/50" />
            <h3 className="font-heading text-2xl font-bold text-white">
              Generating PDF...
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Compressing images into a single high-quality document PDF.
            </p>
          </div>
        )}
      </main>

      {/* PDF Inline Preview Modal */}
      {showPreviewModal && generatedPdf && (
        <PdfPreviewModal
          pdfUrl={generatedPdf.pdfUrl}
          onSavePdf={handleSavePdf}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
