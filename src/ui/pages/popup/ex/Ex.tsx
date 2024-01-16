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

const Ex = () => {
  const navigate = useNavigate();

  return <div className="">heeeey</div>;
};

export { Ex };
