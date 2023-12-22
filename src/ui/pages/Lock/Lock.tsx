import React, { useEffect, useRef, useState } from 'react';
import './Lock.scss';
import { useNavigate } from 'react-router-dom';

const isPasscodeValid = async (codes: string[]): Promise<boolean> => {
  const result = await chrome.storage.local.get(['passcode']);
  if (result.passcode.join('') === codes.join('')) {
    return true;
  }
  return false;
};

const Lock = () => {
  const navigate = useNavigate();

  const [isCreatingPasscode, setIsCreatingPasscode] = useState(true);
  const [isConfirmingPasscode, setIsConfirmingPasscode] = useState(false);
  const [firstPasscode, setFirstPasscode] = useState(Array(6).fill(''));
  const [confirmPasscode, setConfirmPasscode] = useState(Array(6).fill(''));

  const [codes, setCodes] = useState(Array(6).fill(''));

  const [storedPasscode, setStoredPasscode] = useState(undefined);
  const [enterCodeShowError, setEnterCodeShowError] = useState<boolean>(false);
  const [codesErrorMessage, setCodesErrorMessage] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  inputRefs.current = [];

  useEffect(() => {
    chrome.storage.local.get(['passcode'], function (result) {

      if (result.passcode) {
        setStoredPasscode(result.passcode);
        setIsCreatingPasscode(false);
      } else {
        setIsCreatingPasscode(true);
      }
    });
  }, []);

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = event.target.value;

    if (!(value && /^[0-9]$/.test(value)) && value !== '') return;

    setEnterCodeShowError(false);

    const updatedCodes = isConfirmingPasscode
      ? [...confirmPasscode]
      : [...codes];
    updatedCodes[index] = value;
    if (!isConfirmingPasscode) {
      setCodes(updatedCodes);

      if (
        updatedCodes.every((code) => code !== '') &&
        updatedCodes.length === 6
      ) {
        if (storedPasscode) {
          const isValid = await isPasscodeValid(updatedCodes);

          if (isValid) {
            navigate('/');
            return;
          } else {
            setEnterCodeShowError(true);
            setCodesErrorMessage('Invalid passcode, please, try again');
          }
        } else {
          setFirstPasscode(updatedCodes);
          setIsConfirmingPasscode(true);
          setTimeout(() => inputRefs.current[0]?.focus(), 0);
          return;
        }
      }
    } else {
      setConfirmPasscode(updatedCodes);
      if (
        !updatedCodes.some((code) => code === '') &&
        updatedCodes.join('') === firstPasscode.join('')
      ) {
        savePasscode();
      } else {
        setEnterCodeShowError(true);
        setCodesErrorMessage('Passcodes does not match');
      }
    }

    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    } else if (!value && index > 0) {
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
    }
  };

  const savePasscode = () => {
    chrome.storage.local.set({ passcode: codes }, function () {
      console.log('Passcode is set to ' + codes);
    });
    navigate('/');
  };

  // Hide error message if codes is not complete
  const showErrorMessage = !codes.some((code) => code === '');

  const codesToRender = isConfirmingPasscode ? confirmPasscode : codes;
  return (
    <div className="lockPage">
      <div className="lockContainer">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <h1 className="lockLabel">
            {isCreatingPasscode
              ? isConfirmingPasscode
                ? 'Confirm passcode'
                : 'Create passcode'
              : 'Enter passcode'}
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '28px',
          }}
        >
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              value={codesToRender[index]}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => {
                const target = e.target as HTMLInputElement;
                if (e.key === 'Backspace' && target.value === '') {
                  if (index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }
              }}
              style={{
                width: '43px',
                height: '49px',
                flexShrink: 0,
                borderRadius: '8px',
                border: '1px solid #6c6f89',
                background: '#fff',
                textAlign: 'center',
                outline: 'none',
                color: '#434656',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: '600',
                lineHeight: '22px',
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <p className="lockError">
            {showErrorMessage && enterCodeShowError
              ? 'Invalid passcode, please, try again'
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export { Lock };
