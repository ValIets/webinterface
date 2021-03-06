import jQuery from 'jquery';

import config from './config';

(function($) {
    const $statusPage = $('#status-page');
    const $residentPage = $('#resident-page');

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('resident_id')) {
        $statusPage.hide();
        $residentPage.show();
    }

    const socket = new WebSocket(
        `ws://${config.server.ip}:${config.server.port}`
    );

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (urlParams.has('resident_id')) {
            const residentId = urlParams.get('resident_id');

            if (urlParams.has('is_caretaker_coming')) {
                sendCareTakerComingData(
                    residentId,
                    urlParams.get('is_caretaker_coming')
                );

                setTimeout(() => {
                    $(location).attr('href', `?resident_id=${residentId}`);
                }, 2000);
            } else {
                handleResidentPage(residentId);
            }
        } else {
            handleStatusPage();
        }

        function sendCareTakerComingData(residentId, value) {
            socket.send(JSON.stringify({
                id: new Number(residentId),
                is_coming: (value == 'true') ? true : false,
            }));
        }

        function handleResidentPage(residentId) {
            let resident = $.map(data.residents, (resident) => {
                if (resident.id == residentId) {
                    return resident;
                }
            })[0];

            if (!resident) {
                console.log('Resident not found.');
            }

            let statusIcon = `<i class="far fa-circle fa-xs" style="color: darkgreen;"></i>`;
            let statusText = '<span style="color: darkgreen;">In orde</span>';

            if (resident.low_battery) {
                statusIcon = `<i class="fa fa-circle fa-xs" style="color: orange;"></i>`;
                statusText = '<span style="color: orange;">Batterij laag</span>';
            } else if (resident.is_fallen) {
                statusIcon = `<i class="fa fa-circle fa-xs" style="color: red;"></i>`;
                statusText = '<span style="color: red;">Mogelijk gevallen</span>';
                statusText += (resident.is_coming) ? ' <span style="color: red;">en verzorger onderweg</span>' : '';
            }

            const residentName = `${resident.firstname} ${resident.surname}`;
            const residentBirthdate = new Date(resident.birthday);
            let residentBirthdateFormatted = residentBirthdate.toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            residentBirthdateFormatted = residentBirthdateFormatted[0].toUpperCase() + residentBirthdateFormatted.slice(1);
            const residentAge = new Date().getYear() - residentBirthdate.getYear();

            $('#resident-page__title').html(`Bewoner <span style="color: #666;">${residentName}</span> (#${resident.id})`);
            $('#resident-page__firstname').text(resident.firstname);
            $('#resident-page__surname').text(resident.surname);
            $('#resident-page__birthdate').html(`${residentBirthdateFormatted}<br />(${residentAge} jaar oud)`);
            $('#resident-page__location').text(
                `${resident.address}, sectie ${resident.section}`
            );
            $('#resident-page__status').html(`${statusIcon} ${statusText}`);

            if (resident.is_fallen) {
                // If caretaker of resident is coming
                if (resident.is_coming) {
                    $('#resident-page__on-the-way').html(
                        `<p>Verzorger is onderweg.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=false" class="button small no-margin"><i class="fa fa-thumbs-up"></i> Is geholpen</a>`
                    );
                } else {
                    $('#resident-page__on-the-way').html(
                        `<p>Verzorger is niet onderweg.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=true" class="button small no-margin"><i class="fa fa-user-md"></i> Verzorger onderweg?</a>`
                    );
                }
            }
        };

        function handleStatusPage() {
            const $residentsTableRows = $('#residents-table-rows');

            if (data.hasOwnProperty('residents')) {
                $residentsTableRows.empty();

                $.each(data.residents, function(i, resident) {
                    const $tr = $(`<tr data-resident-id="${resident.id}">`);
                    $tr.append($('<td class="resident__id">').text(resident.id));
                    $tr.append(
                        $('<td class="resident__name">').html(
                            `<a href="?resident_id=${resident.id}">${`${resident.firstname} ${resident.surname}`}</a>`
                        )
                    );
                    $tr.append($('<td class="resident__location">').text(resident.location));

                    let statusIcon = `<i class="far fa-circle fa-xs" style="color: darkgreen;"></i>`;
                    let statusText = '<span style="color: darkgreen;">In orde</span>';

                    if (resident.low_battery) {
                        statusIcon = `<i class="fa fa-circle fa-xs" style="color: orange;"></i>`;
                        statusText = '<span style="color: orange;">Batterij laag</span>';
                    } else if (resident.is_fallen) {
                        statusIcon = `<i class="fa fa-circle fa-xs" style="color: red;"></i>`;
                        statusText = '<span style="color: red;">Mogelijk gevallen</span>';
                        statusText += (resident.is_coming) ? '<br /><span style="color: red;">en verzorger onderweg</span>' : '';
                    }

                    $tr.append($('<td class="resident__status-icon">').html(statusIcon));
                    $tr.append($('<td class="resident__status-text">').html(statusText));

                    const $quickActions = $('<td class="resident__quick-actions">');

                    if (resident.is_fallen) {
                        // If caretaker of resident is coming
                        if (resident.is_coming) {
                            $quickActions.html(
                                `<a href="?resident_id=${resident.id}&is_caretaker_coming=false" class="button small no-margin"><i class="fa fa-thumbs-up"></i> Is geholpen</a>`
                            );
                        } else {
                            $quickActions.html(
                                `<a href="?resident_id=${resident.id}&is_caretaker_coming=true" class="button small no-margin"><i class="fa fa-user-md"></i> Verzorger onderweg?</a>`
                            );
                        }
                    }

                    $tr.append($quickActions);
                    $tr.appendTo($residentsTableRows);
                });
            } else if (data.hasOwnProperty('is_fallen')) {
                const $residentTableRow = $residentsTableRows.find(`[data-resident-id="${data.id}"]`);

                let statusIcon = `<i class="far fa-circle fa-xs" style="color: darkgreen;"></i>`;
                let statusText = '<span style="color: darkgreen;">In orde</span>';
                const $quickActions = $residentTableRow.find('.resident__quick-actions');

                // if (resident.low_battery) {
                //     statusIcon = `<i class="fa fa-circle fa-xs" style="color: orange;"></i>`;
                //     statusText = '<span style="color: orange;">Batterij laag</span>';
                // } else
                if (data.is_fallen) {
                    statusIcon = `<i class="fa fa-circle fa-xs" style="color: red;"></i>`;
                    statusText = '<span style="color: red;">Mogelijk gevallen</span>';
                    // statusText += (resident.is_coming) ? '<br /><span style="color: red;">en verzorger onderweg</span>' : '';
                    $quickActions.html(
                        `<a href="?resident_id=${data.id}&is_caretaker_coming=true" class="button small no-margin"><i class="fa fa-user-md"></i> Verzorger onderweg?</a>`
                    );
                }

                $residentTableRow.find('.resident__status-icon').html(statusIcon);
                $residentTableRow.find('.resident__status-text').html(statusText);
            }
        };
    };
})(jQuery);
