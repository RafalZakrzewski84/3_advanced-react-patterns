import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
	createContext,
	useMemo,
	useContext,
	useRef,
} from 'react';
import mojs from 'mo-js';
import styles from './index.css';

const initialState = {
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

		setAnimationTimeline(newAnimationTimeline);
	}, [clapEl, clapCountEl, clapTotalEl]);

	return animationTimeline;
};

//context for providing props to children
const mediumClapContext = createContext();
const { Provider } = mediumClapContext;

const MediumClap = ({ children, onClap }) => {
	const MAX_USER_CLAP = 12;
	const [clapState, setClapState] = useState(initialState);
	const { count } = clapState;

	const [{ clapRef, clapCountRef, clapTotalRef }, setRefState] = useState({});

	//setRef without useCallback generated errors
	const setRef = useCallback((node) => {
		setRefState((prevRefState) => ({
			...prevRefState,
			[node.dataset.refkey]: node,
		}));
	}, []);

	const animationTimeline = useClapAnimation({
		clapEl: clapRef,
		clapCountEl: clapCountRef,
		clapTotalEl: clapTotalRef,
	});

	//setting this value on first render to true
	const mediumClapJustMounted = useRef(true);

	//taking exposed state via a callback to usage component
	useEffect(() => {
		if (!mediumClapJustMounted.current) {
			//not invoked during first mounting
			onClap && onClap(clapState);
		}
		mediumClapJustMounted.current = false;
	}, [count]);

	const handleClapClick = () => {
		animationTimeline.replay();
		setClapState((previousState) => ({
			isClicked: true,
			count: Math.min(previousState.count + 1, MAX_USER_CLAP),
			totalCount:
				count < MAX_USER_CLAP
					? previousState.totalCount + 1
					: previousState.totalCount,
		}));
	};

	//prepare values for children
	const memoizedProviderValues = useMemo(
		() => ({ ...clapState, setRef }),
		[clapState, setRef]
	);

	return (
		//provider component is wrapping all inside MediumClap - children components
		<Provider value={memoizedProviderValues}>
			<button
				ref={setRef}
				data-refkey="clapRef"
				data-description="clapButton"
				className={styles.clap}
				onClick={handleClapClick}>
				{children}
			</button>
		</Provider>
	);
};

/** ====================================
 *      🔰SubComponents
Smaller Component used by <MediumClap />
==================================== **/

const ClapIcon = () => {
	//hook for taking values from context provider
	const { isClicked } = useContext(mediumClapContext);
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
const ClapCount = () => {
	const { count, setRef } = useContext(mediumClapContext);
	return (
		<span
			ref={setRef}
			data-refkey="clapCountRef"
			data-description="clapSpanCount"
			className={styles.count}>
			+{count}
		</span>
	);
};

const CountTotal = () => {
	const { totalCount, setRef } = useContext(mediumClapContext);
	return (
		<span
			ref={setRef}
			data-refkey="clapTotalRef"
			data-description="clapSpanTotal"
			className={styles.total}>
			{totalCount}
		</span>
	);
};

//For exporting
MediumClap.Icon = ClapIcon;
MediumClap.Count = ClapCount;
MediumClap.Total = CountTotal;

//When importing:
//import MediumClap from './MediumClap'
//Before adding properties to MediumClap
//import MediumClap, {ClapIcon, ClapCount, TotalCount} from './MediumClap'

/**
 * Usage of component
 */
const Usage = () => {
	const [usageCount, setUsageCount] = useState(0);

	//Exposing state via a callback
	const handleClap = (clapState) => {
		setUsageCount(clapState.count);
	};

	//now medium clap is wapping children
	return (
		<div style={{ width: '100%' }}>
			<MediumClap onClap={handleClap}>
				<MediumClap.Icon />
				<MediumClap.Count />
				<MediumClap.Total />
			</MediumClap>
			{!!usageCount && (
				<div
					className={styles.info}>{`You have clapped ${usageCount} times`}</div>
			)}
		</div>
	);
};

export default Usage;
