/*___________________________
  | Code | Governorate      |
  |------|------------------|
  | 01   | Cairo            |
  | 02   | Alexandria       |
  | 03   | Port Said        |
  | 04   | Suez             |
  | 11   | Damietta         |
  | 12   | Dakahlia         |
  | 13   | Sharqia          |
  | 14   | Qalyubia         |
  | 15   | Kafr El Sheikh   |
  | 16   | Gharbia          |
  | 17   | Monufia          |
  | 18   | Beheira          |
  | 19   | Ismailia         |
  | 21   | Giza             |
  | 22   | Beni Suef        |
  | 23   | Fayoum           |
  | 24   | Minya            |
  | 25   | Assiut           |
  | 26   | Sohag            |
  | 27   | Qena             |
  | 28   | Aswan            |
  | 29   | Luxor            |
  | 31   | Red Sea          |
  | 32   | New Valley       |
  | 33   | Matruh           |
  | 34   | North Sinai      |
  | 35   | South Sinai      |
  ===========================
*/
/**
 * Verifies if a given string is a valid Saudi National ID
 * @param {string} nationalId - The national ID to verify
 * @returns {object} - Returns true if the ID is valid, false otherwise
 */

function verifyNationalId(nationalId) {
  // Validate national ID format (assuming it should be a string of 14 digits)
  let errorMessage =
    'National ID must be a 14-digit number';
  let isValid = true;

  if (!/^\d{14}$/.test(nationalId)) {
    isValid = false;
    errorMessage =
      'National ID must be a valid 14-digit number';
    return {
      isValid: isValid,
      error: errorMessage,
      userExteraInfo: null,
    };
  }

  // parse the national ID to ensure it's a valid numbers
  const parsedNationalId = parseInt(nationalId, 10);
  if (
    isNaN(parsedNationalId) ||
    parsedNationalId.toString().length !== 14
  ) {
    isValid = false;
    errorMessage =
      'National ID must be a valid 14-digit number';
    return {
      isValid: isValid,
      error: errorMessage,
      userExteraInfo: null,
    };
  }
  // get some information about the user from the national ID
  const gen = parseInt(nationalId.substring(0, 1)); // gets the generation of the person
  const year = parseInt(nationalId.substring(1, 3)); // gets the birth year
  const brithMonth = parseInt(nationalId.substring(3, 5)); // gets birth month
  const brithDay = parseInt(nationalId.substring(5, 7)); // gets birth day
  const cityCode = nationalId.substring(7, 9); // gets the city code
  const gender = parseInt(nationalId.substring(12, 13)); // gets the gender
  // if the generation is 1 or 2, it means the person was born in 1900s, otherwise 2000s
  // if year one digit is 0, it means the person was born in 2000s, otherwise 1900s
  const birthYear =
    gen === 1 || gen === 2
      ? `19${year.toString().padStart(2, '0')}`
      : `20${year.toString().padStart(2, '0')}`;
  // if the gender is an odd number represents male, and an even number represents female.
  const genderText = gender % 2 === 0 ? 'female' : 'male';
  // if the city code is not valid, return an error
  const validCityCodes = [
    '01',
    '02',
    '03',
    '04',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '31',
    '32',
    '33',
    '34',
    '35',
  ];
  const cityNameMap = {
    '01': 'Cairo',
    '02': 'Alexandria',
    '03': 'Port Said',
    '04': 'Suez',
    11: 'Damietta',
    12: 'Dakahlia',
    13: 'Sharqia',
    14: 'Qalyubia',
    15: 'Kafr El Sheikh',
    16: 'Gharbia',
    17: 'Monufia',
    18: 'Beheira',
    19: 'Ismailia',
    21: 'Giza',
    22: 'Beni Suef',
    23: 'Fayoum',
    24: 'Minya',
    25: 'Assiut',
    26: 'Sohag',
    27: 'Qena',
    28: 'Aswan',
    29: 'Luxor',
    31: 'Red Sea',
    32: 'New Valley',
    33: 'Matruh',
    34: 'North Sinai',
    35: 'South Sinai',
  };

  if (!validCityCodes.includes(cityCode)) {
    const error = appError.create(
      'Invalid city code in National ID',
      400,
      httpStatusText.ERROR,
    );
    return next(error);
  }
  // we can use this information to show the user their birth
  const birthDate = `${birthYear}-${brithMonth.toString().padStart(2, '0')}-${brithDay.toString().padStart(2, '0')}`;
  const UserExteraInfo = {
    generation: gen,
    birthYear: birthYear,
    birthMonth: brithMonth,
    birthDay: brithDay,
    cityCode: cityCode,
    cityName: cityNameMap[cityCode],
    gender: genderText,
    birthDate: birthDate,
  };

  return {
    isValid: true,
    error: null,
    userExteraInfo: UserExteraInfo,
  };
}

module.exports = verifyNationalId;

