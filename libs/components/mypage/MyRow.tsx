import { ReactNode } from 'react';
import Link from 'next/link';
import { REACT_APP_API_URL } from '../../config';
import { imageUrl, initials } from '../../utils';

interface MyRowProps {
	/** Without one (a member: no public profile page yet) the row is plain text. */
	href?: string;
	name: string;
	/** Initials come from this when the name has a title in front ("Dr. Han" → "H…"). */
	plainName?: string;
	/** An uploaded photo path; without one the row shows the name's initials. */
	image?: string;
	/** Doctors and members are round, clinics square. */
	round?: boolean;
	/** A small chip before the line below the name (e.g. "Clinic"). */
	chip?: ReactNode;
	sub?: string;
	/** Right side: a time, or a button that must not open the link. */
	end?: ReactNode;
}

/** One line of the MyPage lists (recently visited, followings): photo, name, details, an end slot. */
const MyRow = (props: MyRowProps) => {
	const { href, name, plainName, image, round = false, chip, sub, end } = props;

	const inner = (
		<>
			<span className={`photo ${round ? 'round' : ''}`}>
				{image ? (
					<img src={imageUrl(image, REACT_APP_API_URL)} alt={''} loading={'lazy'} />
				) : (
					initials(plainName ?? name)
				)}
			</span>
			<span className={'text'}>
				<strong>{name}</strong>
				{(chip || sub) && (
					<span className={'sub'}>
						{chip}
						{sub}
					</span>
				)}
			</span>
		</>
	);

	return (
		<div className={'my-row'}>
			{href ? (
				<Link href={href} className={'main'}>
					{inner}
				</Link>
			) : (
				<span className={'main'}>{inner}</span>
			)}
			{end && <span className={'end'}>{end}</span>}
		</div>
	);
};

export default MyRow;
