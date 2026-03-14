import { UIEvent } from 'react';

import { useSearchParams } from 'next/navigation.js';

import MenuEditor from './MenuEditor/MenuEditor';
import SettingsAccount from './SettingsAccount';
import TableEditor from './TableEditor/TableEditor';
import './settings.scss';

const Settings = (props: TSettingsProps) => {
	const { onScroll } = props;
	const queryParams = useSearchParams();
	const subTab = queryParams.get('subTab') ?? '';

	return (
		<div className='settings' onScroll={onScroll}>
			{{
				account: <SettingsAccount />,

				menu: <MenuEditor />,

				tables: <TableEditor />,
			}[subTab]}
		</div>

	);
};

export default Settings;

export type TSettingsProps = {
	onScroll: (event: UIEvent<HTMLDivElement>) => void
}
