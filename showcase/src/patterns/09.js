import React, {
	useCallback,
	useLayoutEffect,
	useState,
	useEffect,
	useRef,
} from 'react';
import mojs from 'mo-js';
import styles from './index.css';
import userStyles from './usage.css';

const INITIAL_STATE = {
	count: 0,
	totalCount: 275,
	isClicked: false,
};

/**
 * Custom hook for animation
 */
const useClapAnimation = ({ clapEl, clapCountEl, clapTotalEl }) => {
	const [animationTimeline, setAnimationTimeline] = useState(
		() => new mojs.Timeline() //lazy invoking of initial state
	);

	useLayoutEffect(() => {
		if (!clapEl || !clapCountEl || !clapTotalEl) {
			return;
		}

		const timelineDuration = 300;
		const scaleButton = new mojs.Html({
			el: clapEl,
			duration: timelineDuration,
			scale: { 1.3: 1 },
			easing: mojs.easing.ease.out,
		});

		const triangleBurst = new mojs.Burst({
			parent: clapEl,
			radius: { 50: 95 },
			count: 5,
			angle: 30,
			duration: timelineDuration,
			children: {
				shape: 'polygon',
				radius: { 6: 0 },
				stroke: 'rgba(211,54,0,0.5',
				strokeWidth: 2,
				angle: 210,
				speed: 0.2,
				delay: 30,
				easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
			},
		});

		const circleBurst = new mojs.Burst({
			parent: clapEl,
			radius: { 50: 75 },
			angle: 25,
			duration: timelineDuration,
			children: {
				shape: 'circle',
				fill: 'rgba(149,165,166,0.5)',
				delay: 30,
				speed: 0.2,
				radius: { 3: 0 },
				easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
			},
		});

		const countAnimation = new mojs.Html({
			el: clapCountEl,
			opacity: { 0: 1 },
			y: { 0: -30 },
			duration: timelineDuration,
		}).then({ opacity: { 1: 0 }, y: -80, delay: timelineDuration / 2 });

		const countTotalAnimation = new mojs.Html({
			el: clapTotalEl,
			opacity: { 0: 1 },
			delay: (3 * timelineDuration) / 2,
			duration: timelineDuration,
			y: { 0: -3 },
		});

		if (typeof clapEl === 'string') {
			const clap = document.getElementById('clap');
			clap.style.transform = 'scale(1,1)';
		} else {
			clapEl.style.transform = 'scale(1,1)';
		}

		const newAnimationTimeline = animationTimeline.add([
			scaleButton,
			countTotalAnimation,
			countAnimation,
			triangleBurst,
			circleBurst,
		]);

		// console.log('in animation hook', clapEl, clapCountEl, clapTotalEl);

		setAnimationTimeline(newAnimationTimeline);
	}, [clapEl, clapCountEl, clapTotalEl]);

	return animationTimeline;
};

/**
 * Custom hook useDOMref
 */
const useDOMref = () => {
	const [DOMref, setRefState] = useState({});

	const setRef = useCallback((node) => {
		setRefState((prevRefState) => ({
			...prevRefState,
			[node.dataset.refkey]: node,
		}));
	}, []);

	// console.log(DOMref);
	return [DOMref, setRef];
};

/**
 * Custom hook for getting previous prop/state
 */
const usePrevious = (value) => {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
};

/**
 * Custom hook for useClapState
 */
const callFncInSequence =
	(...fns) =>
	(...args) => {
		fns.forEach((fn) => fn && fn(...args));
	};

const useClapState = (initialState = INITIAL_STATE) => {
	const MAX_USER_CLAP = 50;

	//set once during mounting component, we are sure initial state doesn't change
	const userInitialState = useRef(initialState);

	const [clapState, setClapState] = useState(initialState);
	const { count, totalCount, isClicked } = clapState;

	const updateClapState = useCallback(() => {
		setClapState(({ count, totalCount }) => ({
			isClicked: true,
			count: Math.min(count + 1, MAX_USER_CLAP),
			totalCount: count < MAX_USER_CLAP ? totalCount + 1 : totalCount,
		}));
	}, [count, totalCount]);

	const resetRef = useRef(0);
	const prevCount = usePrevious(count);
	const reset = useCallback(() => {
		if (prevCount !== count) {
			setClapState(userInitialState.current);
			resetRef.current++;
		}
		//eslint-ignore if not pass dependency
		//eslint-disable-next-line react-hooks/exhaustive-deps
	}, [prevCount, count, setClapState]);

	const getTogglerProps = ({ onClick, ...otherProps } = {}) => ({
		onClick: callFncInSequence(updateClapState, onClick),
		'aria-pressed': isClicked,
		...otherProps,
	});

	const getCounterProps = ({ ...otherProps } = {}) => ({
		count,
		'aria-valuemax': MAX_USER_CLAP,
		'aria-valuemin': 0,
		'aria-valuenow': count,
		...otherProps,
	});

	return {
		clapState,
		updateClapState,
		getTogglerProps,
		getCounterProps,
		reset,
		resetDep: resetRef.current,
	};
};

/**
 * Custom hook useEffectAfterMount
 */
const useEffectAfterMount = (callback, dependency) => {
	const mediumClapJustMounted = useRef(true);

	useEffect(() => {
		if (!mediumClapJustMounted.current) {
			return callback();
		}
		mediumClapJustMounted.current = false;
	}, dependency);
};

/** ====================================
 *      ????SubComponents
Smaller Component used by <MediumClap />
==================================== **/
const ClapContainer = ({ children, setRef, handleClick, ...restProps }) => {
	return (
		<button
			ref={setRef}
			className={styles.clap}
			onClick={handleClick}
			{...restProps}>
			{children}
		</button>
	);
};

const ClapIcon = ({ isClicked }) => {
	return (
		<span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-549 338 100.1 125"
				className={`${styles.icon} ${isClicked && styles.checked}`}>
				<path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
				<path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
			</svg>
		</span>
	);
};

const ClapCount = ({ count, setRef, ...restProps }) => {
	return (
		<span ref={setRef} className={styles.count} {...restProps}>
			+{count}
		</span>
	);
};

const CountTotal = ({ totalCount, setRef, ...restProps }) => {
	return (
		<span ref={setRef} className={styles.total} {...restProps}>
			{totalCount}
		</span>
	);
};

/**
 * Usage of component
 */

const initialUserState = {
	count: 20,
	totalCount: 1000,
	isClicked: true,
};

const Usage = () => {
	const { clapState, getTogglerProps, getCounterProps, reset, resetDep } =
		useClapState(initialUserState);
	const { count, totalCount, isClicked } = clapState;

	const [{ clapRef, clapCountRef, clapTotalRef }, setRef] = useDOMref();

	const animationTimeline = useClapAnimation({
		clapEl: clapRef,
		clapCountEl: clapCountRef,
		clapTotalEl: clapTotalRef,
	});

	useEffectAfterMount(() => {
		animationTimeline.replay();
	}, [count]);

	//fake server update
	const [uploadingReset, setUpload] = useState(false);
	useEffectAfterMount(() => {
		setUpload(true);

		const id = setTimeout(() => {
			setUpload(false);
		}, 3000);

		return () => clearTimeout(id);
	}, [resetDep]);

	const handleClick = () => {
		console.log('CLICKED!!!');
	};

	return (
		<div>
			<div>
				<ClapContainer
					setRef={setRef}
					data-refkey="clapRef"
					{...getTogglerProps({ onClick: handleClick })}>
					<ClapIcon isClicked={isClicked} />
					<ClapCount
						setRef={setRef}
						data-refkey="clapCountRef"
						{...getCounterProps()}
					/>
					<CountTotal
						totalCount={totalCount}
						setRef={setRef}
						data-refkey="clapTotalRef"
					/>
				</ClapContainer>
			</div>
			<section>
				<button onClick={reset} className={userStyles.resetBtn}>
					reset
				</button>
				<pre className={userStyles.resetMsg}>
					{JSON.stringify({ count, totalCount, isClicked })}
				</pre>
				<pre className={userStyles.resetMsg}>
					{uploadingReset ? `uploading reset ${resetDep} ...` : ''}
				</pre>
			</section>
		</div>
	);
};

export default Usage;
