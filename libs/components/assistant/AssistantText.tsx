import React from 'react';

interface AssistantTextProps {
	text: string;
}

/** "**bold**" inside a line → <strong>; everything else stays plain text (no HTML from the model). */
const inline = (line: string, key: string) =>
	line
		.split(/(\*\*[^*]+\*\*)/g)
		.map((part, index) =>
			part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
				<strong key={`${key}-${index}`}>{part.slice(2, -2)}</strong>
			) : (
				<React.Fragment key={`${key}-${index}`}>{part}</React.Fragment>
			),
		);

/**
 * The assistant's reply: models write a little Markdown (bold, "- " lists, blank lines). Only
 * these three are understood and rendered as React elements — never as HTML, so a reply can't
 * inject markup.
 */
const AssistantText = (props: AssistantTextProps) => {
	const { text } = props;
	const blocks: React.ReactNode[] = [];
	let list: string[] = [];

	const flushList = () => {
		if (!list.length) return;
		const items = list;
		blocks.push(
			<ul key={`ul-${blocks.length}`}>
				{items.map((item, index) => (
					<li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>
				))}
			</ul>,
		);
		list = [];
	};

	text.split('\n').forEach((raw, index) => {
		const line = raw.trim();
		const bullet = line.match(/^[-•*]\s+(.*)$/);
		if (bullet) {
			list.push(bullet[1]);
			return;
		}
		flushList();
		if (line) blocks.push(<p key={`p-${index}`}>{inline(line.replace(/^#+\s*/, ''), `p-${index}`)}</p>);
	});
	flushList();

	return <div className={'assistant-text'}>{blocks}</div>;
};

export default AssistantText;
