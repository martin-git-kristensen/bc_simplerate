document.addEventListener('DOMContentLoaded', function() {

    const ratingSystemForm = document.querySelector('.js-send-rate');
    const ratingSystemHearts = document.querySelectorAll('.js-send-rate-col input[type="radio"]');
    const showRateMessage = document.querySelector('.simplerate_success');
    
    let noteFormFieldRequired = false;
    const noteFormField = document.querySelector('.simplerate_form [name="tx_bcsimplerate_pi1[rate][note]"]:not([type=hidden])');
    let cookieExist = false;
    const recodIdFormField = document.querySelector('.simplerate_form [name="tx_bcsimplerate_pi1[rate][recordid]"]');
    const rateFormField = document.querySelector('.simplerate_form [name="tx_bcsimplerate_pi1[rate][rate]"]');
    
    let isFeatureUser = ratingSystemForm ? ratingSystemForm.classList.contains("user-feature") : false;

    ratingSystemHearts.forEach(function(heart) {
        heart.addEventListener('change', function() {
            const inputRating = this.getAttribute('data-rating');

            ratingSystemHearts.forEach(function(h) {
                h.removeAttribute('checked');
            });

            this.setAttribute('checked', 'checked');

            if (ratingSystemForm) {
                ratingSystemForm.setAttribute('data-rated', `${inputRating}`);
            }

            if (noteFormField) {
                noteFormField.parentElement.classList.add('active');
            }

            // Auto-submit when a rating is selected,
            // unless a required note must be entered first.
            if (
                ratingSystemForm &&
                !(noteFormFieldRequired === true && noteFormField)
            ) {
                ratingSystemForm.requestSubmit();
            }
        });
    });

    document.addEventListener('click', function(e) {
        const successMessage = e.target.closest('.simplerate_success');
        if (successMessage) {
            successMessage.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('js-send-rate-submit')) {
            if (document.querySelectorAll(".simplerate_form-col input:checked").length === 0) {
                e.preventDefault();
                return false;
            }
        }
    });
 
    if (noteFormField && noteFormField.parentElement.getAttribute('data-required') == 1) {
        noteFormFieldRequired = true;
    }

    if (ratingSystemForm && parseInt(ratingSystemForm.getAttribute('data-rated')) > 0 && noteFormField) {
        noteFormField.classList.add('active');
    }

    if (isFeatureUser && ratingSystemForm) {
        window.tmpBcRateCookieValueFe = 0;
        
        ratingSystemForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const form = e.target;
             
            if (parseInt(form.getAttribute('data-rated')) > 0 && noteFormFieldRequired === true && noteFormField && noteFormField.value.trim() === '') {
                noteFormField.classList.add('required-field');
                
                const removeRequired = function() {
                    noteFormField.classList.remove('required-field');
                    noteFormField.removeEventListener('change', removeRequired);
                };
                noteFormField.addEventListener('change', removeRequired);
                return false;
            } else if (noteFormField && noteFormField.classList.contains('required-field')) {
                noteFormField.classList.remove('required-field');
            }
     
            if (Cookies.get('tmpBcRateCookieFe') == 1) {
                return false;
            }
    
            if (!Cookies.get('tmpBcRateCookieFe')) {
                window.tmpBcRateCookieValueFe = 1;
                Cookies.set('tmpBcRateCookieFe', '1');
            } else if (Cookies.get('tmpBcRateCookieFe') && Cookies.get('tmpBcRateCookieFe') == 1) {
                return false;
            }
    
            // Zamena za $.ajax pomoću modernog Fetch API-ja
            const formData = new URLSearchParams(new FormData(form)).toString();
            
            fetch(form.getAttribute('action'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (typeof data === 'object') {
                    if (data.status == 'success') {
                        form.querySelectorAll('.js-rating-system-form-col input').forEach(input => input.removeAttribute('checked'));
                        const currentRateInput = form.querySelector('#rating-' + data.rate);
                        if (currentRateInput) currentRateInput.setAttribute('checked', 'checked');
 
                        const ratingCountEl = document.querySelector('.rating_count');
                        const averageRatingStrongEl = document.querySelector('.average_rating strong');
                        const dataRatingEl = document.querySelector('.data_rating');
                        const ratingRecordDataEl = document.querySelector('.rating_record-data');

                        if (data.ratingResults && ratingRecordDataEl && ratingCountEl) {
                            ratingCountEl.textContent = ratingCountEl.textContent.replace(ratingCountEl.textContent.match(/\d+/)[0], data.ratingResults.numberOfRates);
                            if (averageRatingStrongEl) averageRatingStrongEl.textContent = averageRatingStrongEl.textContent.replace(averageRatingStrongEl.textContent.match(/\d+/)[0], data.ratingResults.roundedResult);
                        } else if (ratingRecordDataEl) {
                            ratingRecordDataEl.innerHTML = '<div class="rating_record-data"><span class="average_rating"><strong>'+data.ratingResults.roundedResult+'/'+5+'</strong></span></div>';
                        }
                        
                        if (dataRatingEl) dataRatingEl.setAttribute('data-rating', data.ratingResults.roundedResult);
 
                        if (showRateMessage) showRateMessage.style.display = 'block';
                        
                        form.classList.add('pointer-events-none');
                        const submitBtn = form.querySelector('button');
                        if (submitBtn) submitBtn.setAttribute('disabled', 'disabled');
                        
                        const formCol = form.querySelector('.simplerate_form-col');
                        if (formCol) {
                            formCol.classList.add('rated');
                            formCol.classList.remove('not-rated');
                        }
                    } else if (data.status == 'error') {
                        if (data.message == 'missing_req_field_data') {
                            form.classList.add('pointer-events-none');
                            const submitBtn = form.querySelector('button');
                            if (submitBtn) submitBtn.setAttribute('disabled', 'disabled');
                            const formCol = form.querySelector('.simplerate_form-col');
                            if (formCol) {
                                formCol.classList.add('rated');
                                formCol.classList.remove('not-rated');
                            }
                        } else {
                            const ratingSystemParent = form.closest('.rating-system');
                            if (ratingSystemParent) ratingSystemParent.remove();
                        }
                    } else {
                        form.reset();
                    }
                }
                window.tmpBcRateCookieValueFe = 0;
                Cookies.remove('tmpBcRateCookieFe');
            })
            .catch(error => {
                alert('An error occurred. Please refresh the page and try again.');
                console.error("Error:", error);
                window.tmpBcRateCookieValueFe = 0;
                Cookies.remove('tmpBcRateCookieFe');
            });
        });
 
    } else if (ratingSystemForm) {

        /**
         * Anonymous user rating
         *
         * Cookie format:
         * 2911|4,2912|6,2913|2
         *
         * One entry per rated record.
         */

        const cookieName = ratingSystemForm.dataset.cookieName || 'rateEntity';

        /**
         * Check on page load if the current record
         * has already been rated in this browser.
         */
        if (Cookies.get(cookieName) && recodIdFormField) {
            cookieExist = true;
            const cookieArray = Cookies.get(cookieName).split(',');
            const existingEntry = cookieArray.find(entry => {
                const [recordId] = entry.split('|');
                return recordId === String(recodIdFormField.value);
            });

            if (existingEntry) {
                const [, previousRate] = existingEntry.split('|');
                /**
                 * Restore previously selected rating visually.
                 */
                const currentRateInput = ratingSystemForm.querySelector(
                    '#rating-' + previousRate
                );

                if (currentRateInput) {
                    currentRateInput.checked = true;
                }

                ratingSystemForm.setAttribute(
                    'data-rated',
                    previousRate
                );

                /**
                 * Prevent another rating from this browser.
                 */
                ratingSystemForm.classList.add('pointer-events-none');

                const submitBtn = ratingSystemForm.querySelector('button');

                if (submitBtn) {
                    submitBtn.setAttribute('disabled', 'disabled');
                }

                const formCol = ratingSystemForm.querySelector(
                    '.simplerate_form-col'
                );

                if (formCol) {
                    formCol.classList.add('rated');
                    formCol.classList.remove('not-rated');
                }
            }
        }


        window.tmpBcRateCookieValue = 0;
        ratingSystemForm.addEventListener('submit', function (e) {

            e.preventDefault();

            const form = e.target;

            const currentCookieName =
                form.dataset.cookieName || 'rateEntity';


            /**
             * Extra client-side protection:
             * do not submit if this record is already in the cookie.
             */
            if (
                Cookies.get(currentCookieName) &&
                recodIdFormField
            ) {

                const existingRatings =
                    Cookies.get(currentCookieName).split(',');

                const alreadyRated = existingRatings.some(entry => {

                    const [recordId] = entry.split('|');

                    return recordId ===
                        String(recodIdFormField.value);

                });

                if (alreadyRated) {

                    console.log('Record already rated');

                    return false;
                }
            }


            /**
             * Required note handling.
             */
            if (
                parseInt(form.getAttribute('data-rated')) > 0 &&
                noteFormFieldRequired === true &&
                noteFormField &&
                noteFormField.value.trim() === ''
            ) {

                noteFormField.classList.add('required-field');

                const removeRequired = function () {

                    noteFormField.classList.remove(
                        'required-field'
                    );

                    noteFormField.removeEventListener(
                        'change',
                        removeRequired
                    );
                };

                noteFormField.addEventListener(
                    'change',
                    removeRequired
                );

                return false;

            } else if (
                noteFormField &&
                noteFormField.classList.contains(
                    'required-field'
                )
            ) {

                noteFormField.classList.remove(
                    'required-field'
                );
            }


            /**
             * Temporary cookie protects against
             * double clicking / duplicate requests.
             */
            if (Cookies.get('tmpBcRateCookie') == 1) {

                return false;
            }


            if (!Cookies.get('tmpBcRateCookie')) {
                window.tmpBcRateCookieValue = 1;
                Cookies.set(
                    'tmpBcRateCookie',
                    '1'
                );

            } else if (
                Cookies.get('tmpBcRateCookie') &&
                Cookies.get('tmpBcRateCookie') == 1
            ) {

                return false;
            }


            /**
             * Submit rating.
             */
            const formData =
                new URLSearchParams(
                    new FormData(form)
                ).toString();


            fetch(form.getAttribute('action'), {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded'
                },

                body: formData

            })

            .then(response => response.json())

            .then(data => {

                if (typeof data !== 'object') {

                    form.reset();

                    return;
                }


                if (data.status == 'success') {

                    /**
                     * Update selected rating.
                     */
                    form.querySelectorAll(
                        '.js-rating-system-form-col input'
                    ).forEach(input => {

                        input.removeAttribute('checked');
                        input.checked = false;

                    });


                    const currentRateInput =
                        form.querySelector(
                            '#rating-' + data.rate
                        );


                    if (currentRateInput) {

                        currentRateInput.checked = true;

                        currentRateInput.setAttribute(
                            'checked',
                            'checked'
                        );
                    }


                    form.setAttribute(
                        'data-rated',
                        data.rate
                    );


                    /**
                     * Update average rating result.
                     */
                    const ratingCountEl =
                        document.querySelector(
                            '.rating_count'
                        );

                    const averageRatingStrongEl =
                        document.querySelector(
                            '.average_rating strong'
                        );

                    const dataRatingEl =
                        document.querySelector(
                            '.data_rating'
                        );

                    const ratingRecordDataEl =
                        document.querySelector(
                            '.rating_record-data'
                        );


                    if (
                        data.ratingResults &&
                        ratingRecordDataEl &&
                        ratingCountEl
                    ) {

                        const countMatch =
                            ratingCountEl.textContent.match(
                                /\d+/
                            );


                        if (countMatch) {

                            ratingCountEl.textContent =
                                ratingCountEl.textContent.replace(
                                    countMatch[0],
                                    data.ratingResults.numberOfRates
                                );
                        }


                        if (averageRatingStrongEl) {

                            /**
                             * The max rating is simply the
                             * number of available radio inputs.
                             */
                            const maxRateNumber =
                                ratingSystemHearts.length;


                            averageRatingStrongEl.textContent =
                                data.ratingResults.roundedResult +
                                '/' +
                                maxRateNumber;
                        }

                    } else if (
                        ratingRecordDataEl &&
                        data.ratingResults
                    ) {

                        const maxRateNumber =
                            ratingSystemHearts.length;


                        ratingRecordDataEl.innerHTML =
                            '<span class="average_rating">' +
                                '<strong>' +
                                    data.ratingResults.roundedResult +
                                    '/' +
                                    maxRateNumber +
                                '</strong>' +
                            '</span>';
                    }


                    if (
                        dataRatingEl &&
                        data.ratingResults
                    ) {

                        dataRatingEl.setAttribute(
                            'data-rating',
                            data.ratingResults.roundedResult
                        );
                    }


                    /**
                     * Store anonymous rating.
                     *
                     * IMPORTANT:
                     * We check only recordId when deciding
                     * whether it has already been rated.
                     */
                    const cookieValue =
                        `${data.recordId}|${data.rate}`;


                    let cookieArray = [];


                    if (
                        Cookies.get(currentCookieName)
                    ) {

                        cookieArray =
                            Cookies.get(
                                currentCookieName
                            ).split(',');
                    }


                    const alreadyRated =
                        cookieArray.some(entry => {

                            const [recordId] =
                                entry.split('|');

                            return recordId ===
                                String(data.recordId);
                        });


                    if (!alreadyRated) {

                        cookieArray.push(cookieValue);


                        Cookies.set(
                            currentCookieName,
                            cookieArray.join(','),
                            {
                                expires: 365,
                                path: '/'
                            }
                        );
                    }


                    /**
                     * Feedback message.
                     */
                    if (showRateMessage) {

                        showRateMessage.style.display =
                            'block';
                    }


                    /**
                     * Lock form after successful rating.
                     */
                    form.classList.add(
                        'pointer-events-none'
                    );


                    const submitBtn =
                        form.querySelector('button');


                    if (submitBtn) {

                        submitBtn.setAttribute(
                            'disabled',
                            'disabled'
                        );
                    }


                    const formCol =
                        form.querySelector(
                            '.simplerate_form-col'
                        );


                    if (formCol) {

                        formCol.classList.add(
                            'rated'
                        );

                        formCol.classList.remove(
                            'not-rated'
                        );
                    }


                } else if (
                    data.status == 'error'
                ) {


                    if (
                        data.message ==
                        'missing_req_field_data'
                    ) {

                        form.classList.add(
                            'pointer-events-none'
                        );


                        const submitBtn =
                            form.querySelector('button');


                        if (submitBtn) {

                            submitBtn.setAttribute(
                                'disabled',
                                'disabled'
                            );
                        }


                        const formCol =
                            form.querySelector(
                                '.simplerate_form-col'
                            );


                        if (formCol) {

                            formCol.classList.add(
                                'rated'
                            );

                            formCol.classList.remove(
                                'not-rated'
                            );
                        }


                    } else if (
                        data.message ==
                        'missing_req_field'
                    ) {

                        const ratingSystemParent =
                            form.closest(
                                '.rating-system'
                            );


                        if (ratingSystemParent) {

                            ratingSystemParent.remove();
                        }


                        Cookies.set(
                            'blockRateFor60',
                            'true',
                            {
                                expires: 60,
                                path: '/'
                            }
                        );


                    } else {

                        const ratingSystemParent =
                            form.closest(
                                '.rating-system'
                            );


                        if (ratingSystemParent) {

                            ratingSystemParent.remove();
                        }
                    }


                } else {

                    form.reset();
                }


                /**
                 * Remove temporary request lock.
                 */
                window.tmpBcRateCookieValue = 0;

                Cookies.remove(
                    'tmpBcRateCookie'
                );

            })

            .catch(error => {

                alert(
                    'An error occurred. Please refresh the page and try again.'
                );

                console.error(
                    'Error:',
                    error
                );


                window.tmpBcRateCookieValue = 0;

                Cookies.remove(
                    'tmpBcRateCookie'
                );
            });

        });

    }
});