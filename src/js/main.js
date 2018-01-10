import jQuery from 'jquery';

import config from './config';

(function($) {
    const socket = new WebSocket(
        `ws://${config.server.ip}:${config.server.port}`
    );

    let residents = [];

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        residents = data.residents;

        if (residents.length == 0) {
            console.log('No residents found.');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const $statusPage = $('#status-page');
        const $residentPage = $('#resident-page');

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
            $statusPage.hide();
            $residentPage.show();

            let resident = $.map(residents, (resident) => {
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

            $('#resident-page__id').text(`#${resident.id}`);
            $('#resident-page__title').html(`${statusIcon} ${residentName} (#${resident.id})`);
            $('#resident-page__name').text(residentName);
            $('#resident-page__location').text(
                `${resident.address}, sectie ${resident.section}`
            );
            $('#resident-page__status').html(`${statusIcon} ${statusText}`);

            if (resident.is_fallen) {
                // If caretaker of resident is coming
                if (resident.is_coming) {
                    $('#resident-page__on-the-way').html(
                        `<p>Ja.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=false" class="button small no-margin"><i class="fa fa-thumbs-up"></i> Is geholpen</a>`
                    );
                } else {
                    $('#resident-page__on-the-way').html(
                        `<p>Nee.</p><a href="?resident_id=${resident.id}&is_caretaker_coming=true" class="button small no-margin"><i class="fa fa-user-md"></i> Verzorger onderweg?</a>`
                    );
                }
            }
        };

        function handleStatusPage() {
            const $residentsTableRows = $('#residents-table-rows');
            $residentsTableRows.empty();

            $.each(residents, function(i, resident) {
                const $tr = $('<tr>');
                $tr.append($('<td>').text(resident.id));
                $tr.append(
                    $('<td>').html(
                        `<a href="?resident_id=${resident.id}">${`${resident.firstname} ${resident.surname}`}</a>`
                    )
                );
                $tr.append($('<td>').text(resident.location));

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

                $tr.append($('<td>').html(statusIcon));
                $tr.append($('<td>').html(statusText));

                if (!resident.is_fallen) {
                    $tr.append($('<td>'));
                } else {
                    // If caretaker of resident is coming
                    if (resident.is_coming) {
                        $tr.append(
                            $('<td>').html(
                                `<a href="?resident_id=${resident.id}&is_caretaker_coming=false" class="button small no-margin"><i class="fa fa-thumbs-up"></i> Is geholpen</a>`
                            )
                        );
                    } else {
                        $tr.append(
                            $('<td>').html(
                                `<a href="?resident_id=${resident.id}&is_caretaker_coming=true" class="button small no-margin"><i class="fa fa-user-md"></i> Verzorger onderweg?</a>`
                            )
                        );
                    }
                }

                $tr.appendTo($residentsTableRows);
            });
    };
    };
})(jQuery);
