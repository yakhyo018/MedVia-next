import StarRoundedIcon from '@mui/icons-material/StarRounded';

interface StarsProps {
	value: number;
	size?: number;
}

/** Five stars, the first `value` (rounded) lit. */
const Stars = (props: StarsProps) => {
	const { value, size = 16 } = props;
	const lit = Math.round(value);

	return (
		<span className={'mv-stars'} role={'img'} aria-label={`${value.toFixed(1)} / 5`}>
			{[1, 2, 3, 4, 5].map((n) => (
				<StarRoundedIcon key={n} className={n <= lit ? 'on' : ''} style={{ fontSize: size }} />
			))}
		</span>
	);
};

export default Stars;
