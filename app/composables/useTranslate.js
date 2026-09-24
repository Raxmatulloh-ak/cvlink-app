import en from '@/i18n/en'
import uz from '@/i18n/uz'
import {useAppStore} from '@/stores/app'

const dictionaries = {en, uz}

export const useTranslate = () => {
    const appStore = useAppStore()

    function t(path, fallback = path) {
        const source = dictionaries[appStore.state.locale] || dictionaries.en
        const value = path.split('.').reduce((current, key) => current?.[key], source)
        return value ?? fallback
    }

    return {t}
}
