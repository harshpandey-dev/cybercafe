import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import HomeScreen from './components/HomeScreen';
import AddDocumentModal from './components/AddDocumentModal';
import CropScreen from './components/CropScreen';
import PageListScreen from './components/PageListScreen';
import PdfReadyScreen from './components/PdfReadyScreen';
import AadhaarDetailsScreen from './components/AadhaarDetailsScreen';
import ReviewEmailScreen from './components/ReviewEmailScreen';
import QrCodeScreen from './components/QrCodeScreen';
import CustomerCaseView from './components/CustomerCaseView';
import { suggestDocumentCrop } from './utils/imageAutoCrop';
import { createPdfFromImages } from './utils/pdfGenerator';

export default function App() {
  const getInitialStep = () => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/case/')) {
      return 'CUSTOMER_VIEW';
    }
    return 'HOME';
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [aadhaarDetails, setAadhaarDetails] = useState(null);
  const [createdCaseData, setCreatedCaseData] = useState(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('help@uidai.gov.in');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const config = await res.json();
          if (config.emailRecipient) {
            setEmailRecipient(config.emailRecipient);
          }
        }
      } catch (err) {
        console.warn('Could not load emailRecipient config, using default help@uidai.gov.in');
      }
    }
    fetchConfig();
  }, []);

  const handleStartNewDocument = () => {
    setPages([]);
    setActivePageIndex(null);
    setGeneratedPdf(null);
    setAadhaarDetails(null);
    setCreatedCaseData(null);
    setIsAddModalOpen(true);
  };

  const handleAddImage = async (imageSrc) => {
    setIsAddModalOpen(false);
    const suggestedCrop = await suggestDocumentCrop(imageSrc);

    const newPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      rawImageSrc: imageSrc,
      croppedImage: null,
      cropData: suggestedCrop
        ? { cropPercent: { x: 5, y: 5, width: 90, height: 90 }, rotation: 0, applyScanFilter: false }
        : { cropPercent: { x: 5, y: 5, width: 90, height: 90 }, rotation: 0, applyScanFilter: false },
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
    setCurrentStep('CROP');
  };

  const handleSaveCroppedPage = (croppedData) => {
    setPages((prev) => {
      const updated = [...prev];
      if (activePageIndex !== null && updated[activePageIndex]) {
        updated[activePageIndex] = {
          ...updated[activePageIndex],
          croppedImage: croppedData.croppedImage,
          rawImageSrc: croppedData.rawImageSrc || updated[activePageIndex].rawImageSrc,
          cropData: croppedData.cropData,
        };
      }
      return updated;
    });

    setCurrentStep('PAGE_LIST');
  };

  const handleEditCropPage = (index) => {
    setActivePageIndex(index);
    setCurrentStep('CROP');
  };

  const handleDeletePage = (index) => {
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated);
    if (updated.length === 0) {
      setCurrentStep('HOME');
    }
  };

  const handleReorderPages = (reorderedPages) => {
    setPages(reorderedPages);
  };

  const handleGeneratePdf = async () => {
    const croppedImages = pages.map((p) => p.croppedImage || p.rawImageSrc);
    if (croppedImages.length === 0) {
      alert('Please add at least one cropped page to generate PDF.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const pdfResult = await createPdfFromImages(croppedImages);
      
      let base64Pdf = '';
      const reader = new FileReader();
      reader.readAsDataURL(pdfResult.pdfBlob);
      reader.onloadend = () => {
        base64Pdf = reader.result;
        setGeneratedPdf({
          ...pdfResult,
          pdfBase64: base64Pdf,
        });
        setCurrentStep('PDF_READY');
        setIsGeneratingPdf(false);
      };
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveAadhaarDetails = (details) => {
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
          pdfFilename: `Aadhaar_Documents_${aadhaarDetails.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create temporary case');
      }

      const caseResult = await response.json();
      setCreatedCaseData({
        ...caseResult,
        caseData: {
          caseId: caseResult.caseId,
          name: aadhaarDetails.name,
          aadhaarMasked: `XXXX-XXXX-${aadhaarDetails.aadhaarNumber.slice(-4)}`,
          emailTo: emailRecipient || 'help@uidai.gov.in',
          emailSubject: subject,
          emailBody: body,
          pdfBase64: generatedPdf.pdfBase64,
          pdfFilename: `Aadhaar_Documents_${aadhaarDetails.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          expiresAt: caseResult.expiresAt,
        },
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

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? All current pages will be cleared.')) {
      setPages([]);
      setActivePageIndex(null);
      setGeneratedPdf(null);
      setAadhaarDetails(null);
      setCreatedCaseData(null);
      setCurrentStep('HOME');
      if (window.location.pathname.startsWith('/case/')) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Clean caseId extraction from URL for customer view
  const extractCleanCaseId = () => {
    const raw = window.location.pathname.replace(/^\/case\//, '');
    return raw.split('/')[0].split('?')[0].trim();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {currentStep !== 'CUSTOMER_VIEW' && (
        <>
          <Header onStartOver={handleStartOver} currentStep={currentStep} />
          <ProgressBar currentStep={currentStep} />
        </>
      )}

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {currentStep === 'HOME' && (
          <HomeScreen onStartNewDocument={handleStartNewDocument} />
        )}

        {currentStep === 'CROP' && activePageIndex !== null && pages[activePageIndex] && (
          <CropScreen
            imageSrc={pages[activePageIndex].rawImageSrc}
            initialCrop={pages[activePageIndex].cropData?.cropPercent}
            initialRotation={pages[activePageIndex].cropData?.rotation || 0}
            initialScanFilter={pages[activePageIndex].cropData?.applyScanFilter || false}
            onSaveCroppedPage={handleSaveCroppedPage}
            onRetake={() => setIsAddModalOpen(true)}
            onCancel={() => setCurrentStep(pages.length > 1 ? 'PAGE_LIST' : 'HOME')}
          />
        )}

        {currentStep === 'PAGE_LIST' && (
          <PageListScreen
            pages={pages}
            onAddPage={() => setIsAddModalOpen(true)}
            onEditCrop={handleEditCropPage}
            onDeletePage={handleDeletePage}
            onReorderPages={handleReorderPages}
            onGeneratePdf={handleGeneratePdf}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}

        {currentStep === 'PDF_READY' && generatedPdf && (
          <PdfReadyScreen
            pdfResult={generatedPdf}
            pages={pages}
            onAddMorePages={() => setIsAddModalOpen(true)}
            onContinueToAadhaar={() => setCurrentStep('AADHAAR_DETAILS')}
            onStartOver={handleStartOver}
          />
        )}

        {currentStep === 'AADHAAR_DETAILS' && (
          <AadhaarDetailsScreen
            initialDetails={aadhaarDetails}
            onBack={() => setCurrentStep('PDF_READY')}
            onNext={handleSaveAadhaarDetails}
          />
        )}

        {currentStep === 'REVIEW_EMAIL' && aadhaarDetails && (
          <ReviewEmailScreen
            aadhaarDetails={aadhaarDetails}
            pdfFilename={generatedPdf?.pdfBlob ? `Aadhaar_Documents_${aadhaarDetails.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : ''}
            emailRecipient={emailRecipient}
            onEditDetails={() => setCurrentStep('AADHAAR_DETAILS')}
            onCreateQr={handleCreateCustomerCase}
            isCreatingCase={isCreatingCase}
          />
        )}

        {currentStep === 'QR_CODE' && createdCaseData && (
          <QrCodeScreen
            caseData={createdCaseData}
            onBack={() => setCurrentStep('REVIEW_EMAIL')}
          />
        )}

        {currentStep === 'CUSTOMER_VIEW' && (
          <CustomerCaseView caseId={extractCleanCaseId()} />
        )}
      </main>

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddImage={handleAddImage}
      />
    </div>
  );
}
