<template>
    <div class="app-shell">
        <AppHeader/>
        <main class="auth-layout">
            <aside class="auth-layout__visual d-none d-lg-flex">
                <div class="auth-layout__message">
                    <span class="eyebrow">CVLink</span>
                    <h1>Keep your career data in one place.</h1>
                    <p>Your profile stays reusable while each CV remains focused on the position you are applying for.</p>
                    <div class="auth-layout__points">
                        <span><BaseIcon name="check" :size="15"/> Reusable attributes</span>
                        <span><BaseIcon name="check" :size="15"/> Position templates</span>
                        <span><BaseIcon name="check" :size="15"/> Current CV data</span>
                    </div>
                </div>
                <small>CV Management System</small>
            </aside>
            <section class="auth-layout__form">
                <div class="auth-card"><slot/></div>
            </section>
        </main>
    </div>
</template>
