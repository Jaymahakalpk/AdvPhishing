import { Linking } from 'react-native';

export const openUPIApp = async (amount: number, orderId: string) => {
  // UPI payment parameters
  const upiId = 'merchant@upi'; // Replace with actual merchant UPI ID
  const name = 'Gaon Delivery';
  const transactionNote = `Order #${orderId}`;
  
  // Create UPI deep link
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
  
  try {
    const supported = await Linking.canOpenURL(upiUrl);
    
    if (supported) {
      await Linking.openURL(upiUrl);
      return true;
    } else {
      console.log('UPI app not available');
      return false;
    }
  } catch (error) {
    console.error('Error opening UPI app:', error);
    return false;
  }
};

// Specific app deep links
export const upiApps = {
  phonepe: (amount: number, orderId: string) => 
    `phonepe://pay?pa=merchant@upi&pn=Gaon Delivery&am=${amount}&tn=Order ${orderId}&cu=INR`,
  googlepay: (amount: number, orderId: string) => 
    `gpay://upi/pay?pa=merchant@upi&pn=Gaon Delivery&am=${amount}&tn=Order ${orderId}&cu=INR`,
  paytm: (amount: number, orderId: string) => 
    `paytmmp://pay?pa=merchant@upi&pn=Gaon Delivery&am=${amount}&tn=Order ${orderId}&cu=INR`,
  bhim: (amount: number, orderId: string) => 
    `bhim://pay?pa=merchant@upi&pn=Gaon Delivery&am=${amount}&tn=Order ${orderId}&cu=INR`,
};