import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { SharedModule } from '../../../../shared/shared.module';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';

import { AddUserComponent } from '../add-user/add-user.component';
import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [SharedModule,TranslatePipe],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);


  // ============================================================
  // STATE
  // ============================================================

  /*
   * A plain array signal: setting a NEW array is what tells the
   * (zoneless) app to re-render. Re-setting the same
   * MatTableDataSource instance was ignored by the signal.
   */
  readonly users = signal<User[]>([]);

  readonly errorMessage = signal<string | null>(null);


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    this.loadUsers();
  }


  // ============================================================
  // LOAD USERS
  // ============================================================

  loadUsers(): void {

    this.userService.getUsers().subscribe({
      next: users => {
        this.errorMessage.set(null);
        this.users.set(users ?? []);
      },

      error: () => {
        this.errorMessage.set('common.somethingWentWrong');
      }
    });

  }


  // ============================================================
  // ADD USER
  // ============================================================

  showAddUser(): void {

    this.dialog
      .open(AddUserComponent, {
        data: {
          user: null,
          add: true
        }
      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadUsers();
        }

      });

  }


  // ============================================================
  // EDIT USER
  // ============================================================

  editUser(user: User): void {

    this.dialog
      .open(AddUserComponent, {
        data: {
          user,
          add: false
        }
      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadUsers();
        }

      });

  }


  // ============================================================
  // DELETE USER
  // ============================================================

  deleteUser(user: User): void {

    this.dialog
      .open(ConfirmDeleteComponent, {
        data: this.translate.instant('users.deleteConfirmation')
      })
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }

        this.userService
          .deleteUser(user)
          .subscribe({
            next: () => this.loadUsers(),

            error: () => {
              this.errorMessage.set('common.somethingWentWrong');
            }
          });

      });

  }

}