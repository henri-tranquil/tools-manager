import { Countdown } from './countdown';

describe('Countdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('décompte puis appelle onFinish une seule fois', () => {
    const onFinish = vi.fn();
    const countdown = new Countdown(onFinish);
    countdown.set(3);
    countdown.start();
    expect(countdown.running()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(countdown.remaining()).toBe(2);

    vi.advanceTimersByTime(2500);
    expect(countdown.remaining()).toBe(0);
    expect(countdown.running()).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('se met en pause et reprend', () => {
    const countdown = new Countdown();
    countdown.set(10);
    countdown.start();
    vi.advanceTimersByTime(3000);
    countdown.pause();
    vi.advanceTimersByTime(5000);
    expect(countdown.remaining()).toBe(7);
    expect(countdown.display()).toBe('00:07');
  });

  it('ne démarre pas à zéro', () => {
    const countdown = new Countdown();
    countdown.start();
    expect(countdown.running()).toBe(false);
  });
});
