import React, { useRef, useState } from 'react';
import './Lock.scss';
import { BackButton } from '../../components/BackButton/BackButton';
import { useNavigate } from 'react-router-dom';

const isPasscodeValid = (codes) => {
  const validArray = Array(6).fill('1');
  return JSON.stringify(codes) === JSON.stringify(validArray);
};

const Lock = () => {
  const navigate = useNavigate();

  const [codes, setCodes] = useState(Array(6).fill(''));
  const [phoneCodeShowError, setPhoneCodeShowError] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  inputRefs.current = [];

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = event.target.value;

    if (!(value && /^[0-9]$/.test(value)) && value !== '') return;

    const updatedCodes = [...codes];
    updatedCodes[index] = value;
    setCodes(updatedCodes);

    const isValid = isPasscodeValid(updatedCodes);
    console.log('isValid');
    console.log(isValid);
    if (isValid) {
      setPhoneCodeShowError(false);
      navigate('/');
      return;
    } else {
      setPhoneCodeShowError(true);
    }

    if (value && /^[0-9]$/.test(value) && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (!value && index > 0) {
      inputRefs.current[index]?.focus();
    }
  };

  // Hide error message if codes is not complete
  const showErrorMessage = !codes.some((code) => code === '');

  return (
    <div className="lockPage">
      <BackButton />
      <div className="lockContainer">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <h1 className="lockLabel">Enter passcode</h1>
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
              value={codes[index]}
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
            {showErrorMessage && phoneCodeShowError
              ? 'Invalid passcode, please, try again'
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export { Lock };
