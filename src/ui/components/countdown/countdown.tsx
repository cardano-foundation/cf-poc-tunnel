import React, { useEffect, useState } from "react";

interface CountdownProps {
  expiryDate: string;
}
interface TimeProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown: React.FC<CountdownProps> = ({ expiryDate }) => {
  const calculateTimeLeft = (expiryDate: string) => {
    const difference = +new Date(expiryDate) - +new Date();

    let timeLeft: TimeProps = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiryDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(expiryDate));
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <div>
      <span>
        {timeLeft.days ? <>{timeLeft.days}d</> : null}{" "}
        {timeLeft.hours ? <>{timeLeft.hours}h</> : null}{" "}
        {timeLeft.minutes ? <>{timeLeft.minutes}m</> : null}{" "}
        {timeLeft.seconds ? <>{timeLeft.seconds}s</> : null}
      </span>
    </div>
  );
};

export { Countdown };
