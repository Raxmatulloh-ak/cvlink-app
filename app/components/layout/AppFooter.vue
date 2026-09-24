<template>
    <footer class="site-footer">
        <div class="container-xl py-4 py-md-5">
            <div class="row g-4 align-items-center">
                <div class="col-md-5">
                    <AppLogo/>
                    <p class="site-footer__copy mb-0 mt-2">One profile. Every position-specific CV stays connected.</p>
                </div>
                <div class="col-md-4">
                    <div class="site-footer__links">
                        <NuxtLink to="/">Home</NuxtLink>
                        <NuxtLink to="/positions">Positions</NuxtLink>
                        <NuxtLink to="/auth/sign-in">Sign in</NuxtLink>
                    </div>
                </div>
                <div class="col-md-3 text-md-end">
                    <small class="text-body-secondary">CV Management System · 2026</small>
                </div>
            </div>
        </div>
    </footer>
</template>
