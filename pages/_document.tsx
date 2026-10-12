import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html>
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
				/>

				{/* SEO */}
				<meta name="keyword" content={'medvia, medical tourism, seoul clinics, korea dermatology, dental korea'} />
				<meta
					name={'description'}
					content={
						'Book verified Seoul clinics in your language: real prices, reviews from completed visits, a chat that translates. | ' +
						'Записывайтесь в проверенные клиники Сеула на своём языке. | ' +
						'Seuldagi tekshirilgan klinikalarga oʻz tilingizda yoziling.'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
