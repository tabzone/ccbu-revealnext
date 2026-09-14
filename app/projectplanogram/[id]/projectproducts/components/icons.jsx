export function ReloadIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 400 400"
            className={className}
            fill="currentColor"
        >
            <path d="M198.98245,0c-91.2186,0-167.7673,64.8358-174.7187,149.1778h23.4667
                c7.0124-68.7366,71.0897-124.1153,151.252-124.1153c71.4129,0,130.0594,43.9517,146.9688,102.1426l-59.9238-17.248
                l-6.0391,24.207l94.6504,27.2441l25.3613-101.6738l-22.5351-6.4863l-13.4415,53.8867
                c-24.3827-62.9103-89.7062-107.1348-165.041-107.1348zM25.36135,238.5918L0,340.2656l22.5352,6.4864l13.4414-53.8867
                c24.3827,62.9103,89.7063,107.1347,165.041,107.1347c91.2186,0,167.7673-64.8357,174.7188-149.1778h-23.4668
                c-7.0123,68.7367-71.0897,124.1153-151.252,124.1153c-71.4129,0-130.0593-43.9517-146.9687-102.1427l59.9238,17.2481
                l6.0391-24.207l-94.6504-27.2442z" />
        </svg>
    );
}

export function SearchIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"
            />
        </svg>
    );
}


export function CloseCircleIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
        >
            <path d="M9 9L15 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 9L9 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ArrowLeftIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 52 52"
            className={className}
            fill="currentColor"
        >
            <path d="M34.2,47.7L13.4,27.2c-0.6-0.6-0.6-1.6,0-2.2L34.2,4.5c0.6-0.6,1.6-0.6,2.2,0l2.2,2.2
                c0.6,0.6,0.6,1.6,0,2.2L22.1,25c-0.6,0.6-0.6,1.6,0,2.2l16.3,16.1c0.6,0.6,0.6,1.6,0,2.2l-2.2,2.2
                C35.7,48.2,34.8,48.2,34.2,47.7z" />
        </svg>
    );
}

export function ArrowRightIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 52 52"
            className={className}
            fill="currentColor"
        >
            <path d="M17.9,4.4l20.7,20.5c0.6,0.6,0.6,1.6,0,2.2L17.9,47.6c-0.6,0.6-1.6,0.6-2.2,0l-2.2-2.2
                c-0.6-0.6-0.6-1.6,0-2.2l16.3-16.1c0.6-0.6,0.6-1.6,0-2.2L13.6,8.8c-0.6-0.6-0.6-1.6,0-2.2l2.2-2.2
                C16.4,3.9,17.3,3.9,17.9,4.4z" />
        </svg>
    );
}


export function DoubleArrowLeftIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
        >
            <polyline
                points="11 17 6 12 11 7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="18 17 13 12 18 7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function DoubleArrowRightIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
        >
            <polyline
                points="13 17 18 12 13 7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="6 17 11 12 6 7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


export function ArchiveIcon({ className = "w-6 h-6 text-black" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
        >
            <path
                d="M12.5575 17.5017C12.4152 17.6598 12.2126 17.75 12 17.75C11.7874 17.75 11.5848 17.6598 11.4425 17.5017L8.44254 14.1684C8.16544 13.8605 8.1904 13.3863 8.49828 13.1092C8.80617 12.8321 9.28038 12.8571 9.55748 13.1649L11.25 15.0455V7H4C3.84905 7 3.6452 7 3.5 6.99805V13C3.5 16.7713 3.5 18.6569 4.67157 19.8284C5.84315 21 7.72876 21 11.5 21H12.5C16.2712 21 18.1569 21 19.3284 19.8284C20.5 18.6569 20.5 16.7713 20.5 13V6.99805C20.3548 7 20.1509 7 20 7H12.75V15.0455L14.4425 13.1649C14.7196 12.8571 15.1938 12.8321 15.5017 13.1092C15.8096 13.3863 15.8346 13.8605 15.5575 14.1684L12.5575 17.5017Z"
            />
            <g opacity="0.5">
                <path
                    d="M2 5C2 4.05719 2 3.58579 2.29289 3.29289C2.58579 3 3.05719 3 4 3H20C20.9428 3 21.4142 3 21.7071 3.29289C22 3.58579 22 4.05719 22 5C22 5.94281 22 6.41421 21.7071 6.70711C21.4142 7 20.9428 7 20 7H4C3.05719 7 2.58579 7 2.29289 6.70711C2 6.41421 2 5.94281 2 5Z"
                />
            </g>
        </svg>
    );
}


export function DownloadIcon({ className = "w-6 h-6 text-black" }){
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 14.25C3.41421 14.25 3.75 14.5858 3.75 15C3.75 16.4354 3.75159 17.4365 3.85315 18.1919C3.9518 18.9257 4.13225 19.3142 4.40901 19.591C4.68577 19.8678 5.07435 20.0482 5.80812 20.1469C6.56347 20.2484 7.56459 20.25 9 20.25H15C16.4354 20.25 17.4365 20.2484 18.1919 20.1469C18.9257 20.0482 19.3142 19.8678 19.591 19.591C19.8678 19.3142 20.0482 18.9257 20.1469 18.1919C20.2484 17.4365 20.25 16.4354 20.25 15C20.25 14.5858 20.5858 14.25 21 14.25C21.4142 14.25 21.75 14.5858 21.75 15V15.0549C21.75 16.4225 21.75 17.5248 21.6335 18.3918C21.5125 19.2919 21.2536 20.0497 20.6517 20.6516C20.0497 21.2536 19.2919 21.5125 18.3918 21.6335C17.5248 21.75 16.4225 21.75 15.0549 21.75H8.94513C7.57754 21.75 6.47522 21.75 5.60825 21.6335C4.70814 21.5125 3.95027 21.2536 3.34835 20.6517C2.74643 20.0497 2.48754 19.2919 2.36652 18.3918C2.24996 17.5248 2.24998 16.4225 2.25 15.0549C2.25 15.0366 2.25 15.0183 2.25 15C2.25 14.5858 2.58579 14.25 3 14.25Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 16.75C12.2106 16.75 12.4114 16.6615 12.5535 16.5061L16.5535 12.1311C16.833 11.8254 16.8118 11.351 16.5061 11.0715C16.2004 10.792 15.726 10.8132 15.4465 11.1189L12.75 14.0682V3C12.75 2.58579 12.4142 2.25 12 2.25C11.5858 2.25 11.25 2.58579 11.25 3V14.0682L8.55353 11.1189C8.27403 10.8132 7.79963 10.792 7.49393 11.0715C7.18823 11.351 7.16698 11.8254 7.44648 12.1311L11.4465 16.5061C11.5886 16.6615 11.7894 16.75 12 16.75Z"
        fill="currentColor"
      />
    </svg>
  );
};
