// Define possible operators
enum SMSOperators {
  UNITEL = "Unitel",
  MOBICOM = "Mobicom",
  GMOBILE = "Gmobile",
  SKYTEL = "Skytel",
}

// Define the operator map
const operatorMap: { [key: string]: SMSOperators } = {
  // Unitel
  "80": SMSOperators.UNITEL,
  "86": SMSOperators.UNITEL,
  "88": SMSOperators.UNITEL,
  "89": SMSOperators.UNITEL,

  // Mobicom
  "99": SMSOperators.MOBICOM,
  "95": SMSOperators.MOBICOM,
  "94": SMSOperators.MOBICOM,
  "85": SMSOperators.MOBICOM,
  "84": SMSOperators.MOBICOM,

  // Gmobile
  "98": SMSOperators.GMOBILE,
  "93": SMSOperators.GMOBILE,
  "83": SMSOperators.GMOBILE,
  "97": SMSOperators.GMOBILE,

  // Skytel
  "91": SMSOperators.SKYTEL,
  "96": SMSOperators.SKYTEL,
  "90": SMSOperators.SKYTEL,
};

// Define the structure for the response
interface OperatorResponse {
  found: boolean;
  operator: SMSOperators | null;
}

// Function to get the operator based on the phone number
export const recognizePhoneNumber = (phoneNumber: string): OperatorResponse => {
  // Extract the first two digits

  if (phoneNumber.length !== 8) {
    return {
      found: false,
      operator: null,
    };
  }

  const firstTwoDigits = phoneNumber.substring(0, 2);

  // Check if the digits match an operator
  if (operatorMap[firstTwoDigits]) {
    return {
      found: true,
      operator: operatorMap[firstTwoDigits],
    };
  } else {
    return {
      found: false,
      operator: null,
    };
  }
};
